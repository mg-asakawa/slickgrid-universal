import { I18N } from '@aurelia/i18n';
import { IHttpClient } from '@aurelia/fetch-client';
import { newInstanceOf, resolve } from '@aurelia/kernel';
import { GraphqlService, type GraphqlPaginatedResult, type GraphqlServiceApi } from '@slickgrid-universal/graphql';
import {
  type AureliaGridInstance,
  type Column,
  Filters,
  type GridOption,
  type Metrics,
  type MultipleSelectOption,
  type OnRowCountChangedEventArgs,
} from 'aurelia-slickgrid';

import './example39.scss';
import SAMPLE_DATA_URL from './data/customers_100.json?url';

const GRAPHQL_QUERY_DATASET_NAME = 'users';
const FAKE_SERVER_DELAY = 250;

function unescapeAndLowerCase(val: string) {
  return val.replace(/^"/, '').replace(/"$/, '').toLowerCase();
}

export class Example39 {
  aureliaGrid: AureliaGridInstance;
  backendService!: GraphqlService;
  columnDefinitions!: Column[];
  gridOptions!: GridOption;
  dataset: any[] = [];
  metrics!: Partial<Metrics>;
  tagDataClass = '';
  graphqlQuery = '...';
  hideSubTitle = false;
  processing = false;
  selectedLanguage: string;
  status = { text: 'processing...', class: 'alert alert-danger' };
  serverWaitDelay = FAKE_SERVER_DELAY; // server simulation with default of 250ms but 50ms for Cypress tests

  constructor(
    readonly http: IHttpClient = resolve(newInstanceOf(IHttpClient)),
    private readonly i18n: I18N = resolve(I18N)
  ) {
    this.backendService = new GraphqlService();
    // always start with English for Cypress E2E tests to be consistent
    const defaultLang = 'en';
    this.i18n.setLocale(defaultLang);
    this.selectedLanguage = defaultLang;
    this.initializeGrid();
  }

  aureliaGridReady(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid = aureliaGrid;
  }

  initializeGrid() {
    this.columnDefinitions = [
      {
        id: 'name',
        field: 'name',
        nameKey: 'NAME',
        width: 60,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters.compoundInput,
        },
      },
      {
        id: 'gender',
        field: 'gender',
        nameKey: 'GENDER',
        filterable: true,
        sortable: true,
        width: 60,
        filter: {
          model: Filters.singleSelect,
          collection: [
            { value: '', label: '' },
            { value: 'male', labelKey: 'MALE' },
            { value: 'female', labelKey: 'FEMALE' },
          ],
        },
      },
      {
        id: 'company',
        field: 'company',
        nameKey: 'COMPANY',
        width: 60,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters.multipleSelect,
          customStructure: {
            label: 'company',
            value: 'company',
          },
          collectionSortBy: {
            property: 'company',
            sortDesc: false,
          },
          collectionAsync: this.http.fetch(SAMPLE_DATA_URL).then((e) => e.json()),
          options: {
            filter: true, // adds a filter on top of the multi-select dropdown
          } as MultipleSelectOption,
        },
      },
    ];

    this.gridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableAutoTooltip: true,
      autoTooltipOptions: {
        enableForHeaderCells: true,
      },
      enableTranslate: true,
      i18n: this.i18n,
      enableFiltering: true,
      enableCellNavigation: true,
      multiColumnSort: false,
      gridMenu: {
        resizeOnShowHeaderRow: true,
      },
      backendServiceApi: {
        // we need to disable default internalPostProcess so that we deal with either replacing full dataset or appending to it
        disableInternalPostProcess: true,
        service: this.backendService,
        options: {
          datasetName: GRAPHQL_QUERY_DATASET_NAME, // the only REQUIRED property
          addLocaleIntoQuery: true, // optionally add current locale into the query
          extraQueryArguments: [
            {
              // optionally add some extra query arguments as input query arguments
              field: 'userId',
              value: 123,
            },
          ],
          // enable infinite via Boolean OR via { fetchSize: number }
          infiniteScroll: { fetchSize: 30 }, // or use true, in that case it would use default size of 25
        },
        // you can define the onInit callback OR enable the "executeProcessCommandOnInit" flag in the service init
        // onInit: (query) => this.getCustomerApiCall(query),
        preProcess: () => this.displaySpinner(true),
        process: (query) => this.getCustomerApiCall(query),
        postProcess: (result: GraphqlPaginatedResult) => {
          this.metrics = {
            endTime: new Date(),
            totalItemCount: result.data[GRAPHQL_QUERY_DATASET_NAME].totalCount || 0,
          };
          this.displaySpinner(false);
          this.getCustomerCallback(result);
        },
      } as GraphqlServiceApi,
    };
  }

  clearAllFiltersAndSorts() {
    if (this.aureliaGrid?.gridService) {
      this.aureliaGrid.gridService.clearAllFiltersAndSorts();
    }
  }

  displaySpinner(isProcessing: boolean) {
    this.processing = isProcessing;
    this.status = isProcessing
      ? { text: 'processing...', class: 'alert alert-danger' }
      : { text: 'finished', class: 'alert alert-success' };
  }

  getCustomerCallback(result: any) {
    const { nodes, totalCount } = result.data[GRAPHQL_QUERY_DATASET_NAME];
    if (this.aureliaGrid) {
      this.metrics.totalItemCount = totalCount;

      // even if we're not showing pagination, it is still used behind the scene to fetch next set of data (next page basically)
      // once pagination totalItems is filled, we can update the dataset

      // infinite scroll has an extra data property to determine if we hit an infinite scroll and there's still more data (in that case we need append data)
      // or if we're on first data fetching (no scroll bottom ever occured yet)
      if (!result.infiniteScrollBottomHit) {
        // initial load not scroll hit yet, full dataset assignment
        this.aureliaGrid.slickGrid?.scrollTo(0); // scroll back to top to avoid unwanted onScroll end triggered
        this.dataset = nodes;
        this.metrics.itemCount = nodes.length;
      } else {
        // scroll hit, for better perf we can simply use the DataView directly for better perf (which is better compare to replacing the entire dataset)
        this.aureliaGrid.dataView?.addItems(nodes);
      }

      // NOTE: you can get currently loaded item count via the `onRowCountChanged`slick event, see `refreshMetrics()` below
      // OR you could also calculate it yourself or get it via: `this.aureliaGrid?.dataView.getItemCount() === totalItemCount`
      // console.log('is data fully loaded: ', this.aureliaGrid?.dataView?.getItemCount() === totalItemCount);
    }
  }

  /**
   * Calling your GraphQL backend server should always return a Promise of type GraphqlPaginatedResult
   *
   * @param query
   * @return Promise<GraphqlPaginatedResult>
   */
  getCustomerApiCall(query: string): Promise<GraphqlPaginatedResult> {
    // in your case, you will call your WebAPI function (wich needs to return a Promise)
    // for the demo purpose, we will call a mock WebAPI function
    return this.getCustomerDataApiMock(query);
  }

  getCustomerDataApiMock(query: string): Promise<any> {
    return new Promise<GraphqlPaginatedResult>((resolve) => {
      let firstCount = 0;
      let offset = 0;
      let orderByField = '';
      let orderByDir = '';

      this.http
        .fetch(SAMPLE_DATA_URL)
        .then((e) => e.json())
        .then((data: any) => {
          let filteredData: Array<{ id: number; name: string; gender: string; company: string; category: { id: number; name: string } }> =
            data;
          if (query.includes('first:')) {
            const topMatch = query.match(/first:([0-9]+),/) || [];
            firstCount = +topMatch[1];
          }
          if (query.includes('offset:')) {
            const offsetMatch = query.match(/offset:([0-9]+),/) || [];
            offset = +offsetMatch[1];
          }
          if (query.includes('orderBy:')) {
            const [_, field, dir] = /orderBy:\[{field:([a-zA-Z/]+),direction:(ASC|DESC)}\]/gi.exec(query) || [];
            orderByField = field || '';
            orderByDir = dir || '';
          }
          if (query.includes('orderBy:')) {
            const [_, field, dir] = /orderBy:\[{field:([a-zA-Z/]+),direction:(ASC|DESC)}\]/gi.exec(query) || [];
            orderByField = field || '';
            orderByDir = dir || '';
          }
          if (query.includes('filterBy:')) {
            const regex = /{field:(\w+),operator:(\w+),value:([0-9a-z',"\s]*)}/gi;

            // loop through all filters
            let matches;
            while ((matches = regex.exec(query)) !== null) {
              const field = matches[1] || '';
              const operator = matches[2] || '';
              const value = matches[3] || '';

              let [term1, term2] = value.split(',');

              if (field && operator && value !== '') {
                filteredData = filteredData.filter((dataContext: any) => {
                  const dcVal = dataContext[field];
                  // remove any double quotes & lowercase the terms
                  term1 = unescapeAndLowerCase(term1);
                  term2 = unescapeAndLowerCase(term2 || '');

                  switch (operator) {
                    case 'EQ':
                      return dcVal.toLowerCase() === term1;
                    case 'NE':
                      return dcVal.toLowerCase() !== term1;
                    case 'LE':
                      return dcVal.toLowerCase() <= term1;
                    case 'LT':
                      return dcVal.toLowerCase() < term1;
                    case 'GT':
                      return dcVal.toLowerCase() > term1;
                    case 'GE':
                      return dcVal.toLowerCase() >= term1;
                    case 'EndsWith':
                      return dcVal.toLowerCase().endsWith(term1);
                    case 'StartsWith':
                      return dcVal.toLowerCase().startsWith(term1);
                    case 'Starts+Ends':
                      return dcVal.toLowerCase().startsWith(term1) && dcVal.toLowerCase().endsWith(term2);
                    case 'Contains':
                      return dcVal.toLowerCase().includes(term1);
                    case 'Not_Contains':
                      return !dcVal.toLowerCase().includes(term1);
                    case 'IN':
                      const terms = value.toLocaleLowerCase().split(',');
                      for (const term of terms) {
                        if (dcVal.toLocaleLowerCase() === unescapeAndLowerCase(term)) {
                          return true;
                        }
                      }
                      break;
                  }
                });
              }
            }
          }

          // make sure page skip is not out of boundaries, if so reset to first page & remove skip from query
          let firstRow = offset;
          if (firstRow > filteredData.length) {
            query = query.replace(`offset:${firstRow}`, '');
            firstRow = 0;
          }

          // sorting when defined
          const selector = (obj: any) => (orderByField ? obj[orderByField] : obj);
          switch (orderByDir.toUpperCase()) {
            case 'ASC':
              filteredData = filteredData.sort((a, b) => selector(a).localeCompare(selector(b)));
              break;
            case 'DESC':
              filteredData = filteredData.sort((a, b) => selector(b).localeCompare(selector(a)));
              break;
          }

          // return data subset (page)
          const updatedData = filteredData.slice(firstRow, firstRow + firstCount);

          // in your case, you will call your WebAPI function (wich needs to return a Promise)
          // for the demo purpose, we will call a mock WebAPI function
          const mockedResult = {
            // the dataset name is the only unknown property
            // will be the same defined in your GraphQL Service init, in our case GRAPHQL_QUERY_DATASET_NAME
            data: {
              [GRAPHQL_QUERY_DATASET_NAME]: {
                nodes: updatedData,
                totalCount: filteredData.length,
              },
            },
          };

          window.setTimeout(() => {
            this.graphqlQuery = this.gridOptions.backendServiceApi!.service.buildQuery();
            resolve(mockedResult);
          }, this.serverWaitDelay);
        });
    });
  }

  refreshMetrics(args: OnRowCountChangedEventArgs) {
    if (args?.current >= 0) {
      this.metrics.itemCount = this.aureliaGrid.dataView?.getFilteredItemCount() || 0;
      this.tagDataClass = this.metrics.itemCount === this.metrics.totalItemCount ? 'fully-loaded' : 'partial-load';
    }
  }

  async switchLanguage() {
    const nextLanguage = this.selectedLanguage === 'en' ? 'fr' : 'en';
    await this.i18n.setLocale(nextLanguage);
    this.selectedLanguage = nextLanguage;
  }

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    this.aureliaGrid.resizerService.resizeGrid(0);
  }
}
