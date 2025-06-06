import { Component, type OnDestroy, type OnInit } from '@angular/core';
import { format as tempoFormat } from '@formkit/tempo';
import { TranslateService } from '@ngx-translate/core';
import type { Subscription } from 'rxjs';
import {
  type AngularGridInstance,
  type Column,
  Filters,
  Formatters,
  type GridOption,
  type GridState,
  type GridStateChange,
  type MultipleSelectOption,
  unsubscribeAllObservables,
} from '../../library';

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
const DEFAULT_PAGE_SIZE = 25;
const LOCAL_STORAGE_KEY = 'gridState';
const NB_ITEMS = 500;

@Component({
  templateUrl: './example15.component.html',
  standalone: false,
})
export class Example15Component implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  angularGrid!: AngularGridInstance;
  columnDefinitions!: Column[];
  gridOptions!: GridOption;
  dataset!: any[];
  hideSubTitle = false;
  selectedLanguage: string;

  constructor(private translate: TranslateService) {
    this.selectedLanguage = this.translate.getDefaultLang();
  }

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
  }

  ngOnDestroy() {
    // also unsubscribe all Angular Subscriptions
    unsubscribeAllObservables(this.subscriptions);
  }

  ngOnInit(): void {
    const presets = JSON.parse(localStorage[LOCAL_STORAGE_KEY] || null);

    // use some Grid State preset defaults if you wish or just restore from Locale Storage
    // presets = presets || this.useDefaultPresets();
    this.defineGrid(presets);

    // always start with English for Cypress E2E tests to be consistent
    const defaultLang = 'en';
    this.translate.use(defaultLang);
    this.selectedLanguage = defaultLang;
  }

  /** Clear the Grid State from Local Storage and reset the grid to it's original state */
  clearGridStateFromLocalStorage() {
    this.angularGrid.gridService.resetGrid(this.columnDefinitions);
    this.angularGrid.paginationService!.changeItemPerPage(DEFAULT_PAGE_SIZE);
    setTimeout(() => (localStorage[LOCAL_STORAGE_KEY] = null));
  }

  /* Define grid Options and Columns */
  defineGrid(gridStatePresets?: GridState) {
    // prepare a multiple-select array to filter with
    const multiSelectFilterArray = [];
    for (let i = 0; i < NB_ITEMS; i++) {
      multiSelectFilterArray.push({ value: i, label: i });
    }

    this.columnDefinitions = [
      {
        id: 'title',
        name: 'Title',
        field: 'title',
        nameKey: 'TITLE',
        filterable: true,
        sortable: true,
        minWidth: 45,
        width: 100,
        filter: {
          model: Filters.compoundInput,
        },
      },
      {
        id: 'description',
        name: 'Description',
        field: 'description',
        filterable: true,
        sortable: true,
        minWidth: 80,
        width: 100,
        filter: {
          model: Filters.input,
          filterShortcuts: [
            { titleKey: 'BLANK_VALUES', searchTerms: ['< A'], iconCssClass: 'mdi mdi-filter-minus-outline' },
            { titleKey: 'NON_BLANK_VALUES', searchTerms: ['> A'], iconCssClass: 'mdi mdi-filter-plus-outline' },
          ],
        },
      },
      {
        id: 'duration',
        name: 'Duration (days)',
        field: 'duration',
        sortable: true,
        type: 'number',
        exportCsvForceToKeepAsString: true,
        minWidth: 55,
        width: 100,
        nameKey: 'DURATION',
        filterable: true,
        filter: {
          collection: multiSelectFilterArray,
          model: Filters.multipleSelect,
          // we could add certain option(s) to the "multiple-select" plugin
          options: {
            maxHeight: 250,
            width: 175,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'complete',
        name: '% Complete',
        field: 'percentComplete',
        nameKey: 'PERCENT_COMPLETE',
        minWidth: 70,
        type: 'number',
        sortable: true,
        width: 100,
        formatter: Formatters.percentCompleteBar,
        filterable: true,
        filter: { model: Filters.slider, operator: '>' },
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        nameKey: 'START',
        formatter: Formatters.dateIso,
        sortable: true,
        minWidth: 75,
        exportWithFormatter: true,
        width: 100,
        type: 'date',
        filterable: true,
        filter: {
          model: Filters.compoundDate,
          filterShortcuts: [
            { titleKey: 'PAST', searchTerms: [tempoFormat(new Date(), 'YYYY-MM-DD')], operator: '<', iconCssClass: 'mdi mdi-calendar' },
            {
              titleKey: 'FUTURE',
              searchTerms: [tempoFormat(new Date(), 'YYYY-MM-DD')],
              operator: '>',
              iconCssClass: 'mdi mdi-calendar-clock',
            },
          ],
        },
      },
      {
        id: 'completed',
        field: 'completed',
        nameKey: 'COMPLETED',
        minWidth: 85,
        maxWidth: 85,
        formatter: Formatters.checkmarkMaterial,
        width: 100,
        type: 'boolean',
        sortable: true,
        filterable: true,
        filter: {
          collection: [
            { value: '', label: '' },
            { value: true, label: 'True' },
            { value: false, label: 'False' },
          ],
          model: Filters.singleSelect,

          // we could add certain option(s) to the "multiple-select" plugin
          options: { autoAdjustDropHeight: true } as MultipleSelectOption,
        },
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableCheckboxSelector: true,
      enableFiltering: true,
      enableTranslate: true,
      i18n: this.translate,
      columnPicker: {
        hideForceFitButton: true,
      },
      gridMenu: {
        hideForceFitButton: true,
        hideClearFrozenColumnsCommand: false,
      },
      headerMenu: {
        hideFreezeColumnsCommand: false,
      },
      enablePagination: true,
      pagination: {
        pageSizes: [5, 10, 15, 20, 25, 30, 40, 50, 75, 100],
        pageSize: DEFAULT_PAGE_SIZE,
      },
    };

    // reload the Grid State with the grid options presets
    if (gridStatePresets) {
      this.gridOptions.presets = gridStatePresets;
    }

    this.dataset = this.getData(NB_ITEMS);
  }

  getData(count: number) {
    // mock a dataset
    const currentYear = new Date().getFullYear();
    const tmpData: any[] = [];
    for (let i = 0; i < count; i++) {
      const randomDuration = Math.round(Math.random() * 100);
      const randomYear = randomBetween(currentYear - 15, currentYear + 8);
      const randomYearShort = randomBetween(10, 25);
      const randomMonth = randomBetween(1, 12);
      const randomMonthStr = randomMonth < 10 ? `0${randomMonth}` : randomMonth;
      const randomDay = randomBetween(10, 28);
      const randomPercent = randomBetween(0, 100);
      const randomHour = randomBetween(10, 23);
      const randomTime = randomBetween(10, 59);

      tmpData[i] = {
        id: i,
        title: 'Task ' + i,
        etc: 'Something hidden ' + i,
        description: i % 5 ? 'desc ' + i : null, // also add some random to test NULL field
        duration: randomDuration,
        percentComplete: randomPercent,
        percentCompleteNumber: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay), // provide a Date format
        usDateShort: `${randomMonth}/${randomDay}/${randomYearShort}`, // provide a date US Short in the dataset
        utcDate: `${randomYear}-${randomMonthStr}-${randomDay}T${randomHour}:${randomTime}:${randomTime}Z`,
        completed: i % 3 === 0,
      };
    }
    return tmpData;
  }

  /** Dispatched event of a Grid State Changed event */
  gridStateChanged(gridStateChanges: GridStateChange) {
    console.log('Client sample, Grid State changed:: ', gridStateChanges);
    localStorage[LOCAL_STORAGE_KEY] = JSON.stringify(gridStateChanges.gridState);
  }

  /** Save current Filters, Sorters in LocaleStorage or DB */
  saveCurrentGridState() {
    const gridState: GridState = this.angularGrid.gridStateService.getCurrentGridState();
    console.log('Client sample, last Grid State:: ', gridState);
    localStorage[LOCAL_STORAGE_KEY] = JSON.stringify(gridState);
  }

  switchLanguage() {
    const nextLanguage = this.selectedLanguage === 'en' ? 'fr' : 'en';
    this.subscriptions.push(
      this.translate.use(nextLanguage).subscribe(() => {
        this.selectedLanguage = nextLanguage;
      })
    );
  }

  useDefaultPresets() {
    // use columnDef searchTerms OR use presets as shown below
    return {
      columns: [
        { columnId: 'description', width: 170 }, // flip column position of Title/Description to Description/Title
        { columnId: 'title', width: 55 },
        { columnId: 'duration' },
        { columnId: 'complete' },
        { columnId: 'start' },
        { columnId: 'usDateShort' },
        { columnId: 'utcDate' },
        // { columnId: 'completed' }, // to HIDE a column, simply ommit it from the preset array
      ],
      filters: [
        { columnId: 'duration', searchTerms: [2, 22, 44] },
        // { columnId: 'complete', searchTerms: ['5'], operator: '>' },
        { columnId: 'usDateShort', operator: '<', searchTerms: ['4/20/25'] },
        // { columnId: 'completed', searchTerms: [true] }
      ],
      sorters: [
        { columnId: 'duration', direction: 'DESC' },
        { columnId: 'complete', direction: 'ASC' },
      ],
    } as GridState;
  }

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    this.angularGrid.resizerService.resizeGrid(0);
  }
}
