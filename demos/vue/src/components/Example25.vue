<script setup lang="ts">
import type { GraphqlResult, GraphqlServiceApi } from '@slickgrid-universal/graphql';
import { GraphqlService } from '@slickgrid-universal/graphql';
import {
  type GridOption,
  type Metrics,
  type MultipleSelectOption,
  type SlickgridVueInstance,
  type Column,
  Filters,
  Formatters,
  OperatorType,
  SlickgridVue,
} from 'slickgrid-vue';
import { onBeforeMount, ref, type Ref } from 'vue';

const COUNTRIES_API = 'https://countries.trevorblades.com/';

export interface Country {
  countryCode: string;
  countryName: string;
  countryNative: string;
  countryPhone: number;
  countryCurrency: string;
  countryEmoji: string;
  continentCode: string;
  continentName: string;
  languageCode: string;
  languageName: string;
  languageNative: string;
}

const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);
const metrics = ref<Metrics>();
const processing = ref(false);
const status = ref({ text: '', class: '' });
const showSubTitle = ref(true);
let vueGrid!: SlickgridVueInstance;

onBeforeMount(() => {
  defineGrid();
});

/* Define grid Options and Columns */
function defineGrid() {
  columnDefinitions.value = [
    { id: 'countryCode', field: 'code', name: 'Code', maxWidth: 90, sortable: true, filterable: true, columnGroup: 'Country' },
    { id: 'countryName', field: 'name', name: 'Name', width: 60, sortable: true, filterable: true, columnGroup: 'Country' },
    { id: 'countryNative', field: 'native', name: 'Native', width: 60, sortable: true, filterable: true, columnGroup: 'Country' },
    {
      id: 'countryPhone',
      field: 'phone',
      name: 'Phone Area Code',
      maxWidth: 110,
      sortable: true,
      filterable: true,
      columnGroup: 'Country',
    },
    {
      id: 'countryCurrency',
      field: 'currency',
      name: 'Currency',
      maxWidth: 90,
      sortable: true,
      filterable: true,
      columnGroup: 'Country',
    },
    { id: 'countryEmoji', field: 'emoji', name: 'Emoji', maxWidth: 90, sortable: true, columnGroup: 'Country' },
    {
      id: 'languageName',
      field: 'languages.name',
      name: 'Names',
      width: 60,
      formatter: Formatters.arrayObjectToCsv,
      columnGroup: 'Language',
      params: { propertyNames: ['name'], useFormatterOuputToFilter: true },
      filterable: true,
      // this Filter is a bit more tricky than others since the values are an array of objects
      // what we can do is use the Formatter to search from the CSV string coming from the Formatter (with "useFormatterOuputToFilter: true")
      // we also need to use the Operator IN_CONTAINS
      filter: {
        model: Filters.multipleSelect,
        collectionAsync: getLanguages(),
        operator: OperatorType.inContains,
        collectionOptions: {
          addBlankEntry: true,
          // the data is not at the root of the array, so we must tell the Select Filter where to pull the data
          collectionInsideObjectProperty: 'data.languages',
        },
        collectionFilterBy: [
          // filter out any empty values
          { property: 'name', value: '', operator: 'NE' },
          { property: 'name', value: null, operator: 'NE' },
        ],
        collectionSortBy: { property: 'name' },
        customStructure: { value: 'name', label: 'name' },
        options: { filter: true } as MultipleSelectOption,
      },
    },
    {
      id: 'languageNative',
      field: 'languages.native',
      name: 'Native',
      width: 60,
      formatter: Formatters.arrayObjectToCsv,
      params: { propertyNames: ['native'], useFormatterOuputToFilter: true },
      columnGroup: 'Language',
      filterable: true,
      filter: {
        model: Filters.multipleSelect,
        collectionAsync: getLanguages(),
        operator: OperatorType.inContains,
        collectionOptions: {
          addBlankEntry: true,
          // the data is not at the root of the array, so we must tell the Select Filter where to pull the data
          collectionInsideObjectProperty: 'data.languages',
        },
        collectionFilterBy: [
          // filter out any empty values
          { property: 'native', value: '', operator: 'NE' },
          { property: 'native', value: null, operator: 'NE' },
        ],
        collectionSortBy: { property: 'native' },
        customStructure: { value: 'native', label: 'native' },
        options: { filter: true } as MultipleSelectOption,
      },
    },
    {
      id: 'languageCode',
      field: 'languages.code',
      name: 'Codes',
      maxWidth: 100,
      formatter: Formatters.arrayObjectToCsv,
      params: { propertyNames: ['code'], useFormatterOuputToFilter: true },
      columnGroup: 'Language',
      filterable: true,
    },
    {
      id: 'continentName',
      field: 'continent.name',
      name: 'Name',
      width: 60,
      sortable: true,
      filterable: true,
      formatter: Formatters.complexObject,
      columnGroup: 'Continent',
    },
    {
      id: 'continentCode',
      field: 'continent.code',
      name: 'Code',
      maxWidth: 90,
      sortable: true,
      filterable: true,
      filter: {
        model: Filters.singleSelect,
        collectionAsync: getContinents(),
        collectionOptions: {
          // the data is not at the root of the array, so we must tell the Select Filter where to pull the data
          collectionInsideObjectProperty: 'data.continents',
          addBlankEntry: true,
          separatorBetweenTextLabels: ': ',
        },
        customStructure: {
          value: 'code',
          label: 'code',
          labelSuffix: 'name',
        },
      },
      formatter: Formatters.complexObject,
      columnGroup: 'Continent',
    },
  ];

  gridOptions.value = {
    autoResize: {
      container: '#demo-container',
      rightPadding: 10,
    },
    enableFiltering: true,
    enableCellNavigation: true,
    enablePagination: false,
    enableTranslate: true,
    createPreHeaderPanel: true,
    showPreHeaderPanel: true,
    preHeaderPanelHeight: 28,
    datasetIdPropertyName: 'code',
    showCustomFooter: true, // display some metrics in the bottom custom footer
    backendServiceApi: {
      // use the GraphQL Service to build the query but use local (in memory) Filtering/Sorting strategies
      // the useLocalFiltering/useLocalSorting flags can be enabled independently
      service: new GraphqlService(),
      useLocalFiltering: true,
      useLocalSorting: true,

      options: {
        datasetName: 'countries', // the only REQUIRED property
      },
      // you can define the onInit callback OR enable the "executeProcessCommandOnInit" flag in the service init
      preProcess: () => displaySpinner(true),
      process: (query) => getCountries(query),
      postProcess: (result: GraphqlResult<Country>) => {
        metrics.value = result.metrics as Metrics;
        displaySpinner(false);
      },
    } as GraphqlServiceApi,
  };
}

function toggleSubTitle() {
  showSubTitle.value = !showSubTitle.value;
  const action = showSubTitle.value ? 'remove' : 'add';
  document.querySelector('.subtitle')?.classList[action]('hidden');
  queueMicrotask(() => vueGrid.resizerService.resizeGrid());
}

function vueGridReady(grid: SlickgridVueInstance) {
  vueGrid = grid;
}

function displaySpinner(isProcessing: boolean) {
  processing.value = isProcessing;
  status.value = isProcessing ? { text: 'processing...', class: 'alert alert-danger' } : { text: 'finished', class: 'alert alert-success' };
}

// --
// NOTE - Demo Code ONLY
// This Example calls multiple GraphQL queries, this is ONLY for demo purposes, you would typically only call 1 query (which is what GraphQL is good at)
// This demo is mainly to show the use of GraphqlService to build the query and retrieve the data but also to show how to mix that with usage of local Filtering/Sorting strategies
// --

/** Calling the GraphQL backend API to get the Countries with the Query created by the "process" method of GraphqlService  */
function getCountries(query: string): Promise<GraphqlResult<Country>> {
  return new Promise((resolve) => {
    fetch(COUNTRIES_API, {
      method: 'post',
      body: JSON.stringify({ query }),
      headers: { 'Content-type': 'application/json; charset=UTF-8' },
    }).then((response) => {
      resolve(response.json());
    });
  });
}

/**
 * Calling again the GraphQL backend API, however in this case we cannot use the GraphQL Service to build the query
 * So we will have to write, by hand, the query to get the continents code & name
 * We also need to resolve the data in a flat array (singleSelect/multipleSelect Filters only accept data at the root of the array)
 */
function getContinents(): Promise<GraphqlResult<{ code: string; name: string }>> {
  const continentQuery = `query { continents { code, name  }}`;
  return new Promise((resolve) => {
    fetch(COUNTRIES_API, {
      method: 'post',
      body: JSON.stringify({ query: continentQuery }),
      headers: { 'Content-type': 'application/json; charset=UTF-8' },
    }).then((response) => {
      resolve(response.json());
    });
  });
}

/**
 * Calling again the GraphQL backend API, however in this case we cannot use the GraphQL Service to build the query
 * So we will have to write, by hand, the query to get the languages code & name
 * We also need to resolve the data in a flat array (singleSelect/multipleSelect Filters only accept data at the root of the array)
 */
function getLanguages(): Promise<GraphqlResult<{ code: string; name: string; native: string }>> {
  const languageQuery = `query { languages { code, name, native  }}`;
  return new Promise((resolve) => {
    fetch(COUNTRIES_API, {
      method: 'post',
      body: JSON.stringify({ query: languageQuery }),
      headers: { 'Content-type': 'application/json; charset=UTF-8' },
    }).then((response) => {
      resolve(response.json());
    });
  });
}
</script>

<template>
  <h2>
    Example 25: GraphQL Basic API without Pagination
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example25.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
    <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
  </h2>

  <div class="subtitle">
    Use basic GraphQL query with any external public APIs (<a
      href="https://ghiscoding.gitbook.io/slickgrid-vue/backend-services/graphql"
      target="_blank"
      >Wiki docs</a
    >).
    <ul>
      <li>
        This Examples uses a Public GraphQL API that you can find at this link
        <a href="https://countries.trevorblades.com/" target="_blank">https://countries.trevorblades.com/</a>
      </li>
      <li>Compare to the regular and default GraphQL implementation, you will find the following differences</li>
      <ul>
        <li>
          There are no Pagination and we only use GraphQL <b>once</b> to load the data, then we use the grid as a regular local in-memory
          grid
        </li>
        <li>
          We enabled the following 2 flags "useLocalFiltering" and "useLocalSorting" to use regular (in memory) DataView filtering/sorting
        </li>
      </ul>
      <li>
        NOTE - This Example calls multiple GraphQL queries, this is <b>ONLY</b> for demo purposes, you would typically only call 1 query
        (which is what GraphQL is good at)
      </li>
      <li>
        This example is mainly to demo the use of GraphqlService to build the query and retrieve the data but also to demo how to mix that
        with local (in-memory) Filtering/Sorting strategies
      </li>
    </ul>
  </div>

  <div class="row">
    <div class="col-xs-6 col-sm-3">
      <div :class="status.class" role="alert" data-test="status">
        <strong>Status: </strong> {{ status.text }}
        <span :hidden="!processing">
          <i class="mdi mdi-sync mdi-spin"></i>
        </span>
      </div>
    </div>
  </div>

  <slickgrid-vue
    v-model:options="gridOptions"
    v-model:columns="columnDefinitions"
    v-model:data="dataset"
    grid-id="grid25"
    @onVueGridCreated="vueGridReady($event.detail)"
  >
  </slickgrid-vue>
</template>
<style lang="scss" scoped>
@use '@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-bootstrap.scss' with (
  $slick-preheader-font-size: 18px,
  $slick-preheader-border-right: 1px solid lightgrey
);

.alert {
  padding: 8px;
}
</style>
