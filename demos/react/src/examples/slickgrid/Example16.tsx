import {
  type Column,
  Filters,
  Formatters,
  type GridOption,
  type OnEventArgs,
  SlickgridReact,
  type SlickgridReactInstance,
} from 'slickgrid-react';
import React, { useEffect, useRef, useState } from 'react';

const Example16: React.FC = () => {
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [dataset, setDataset] = useState<any[]>(getData());
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => {
    defineGrid();
    getData();
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  /* Define grid Options and Columns */
  function defineGrid() {
    const columnDefinitions: Column[] = [
      { id: 'title', name: 'Title', field: 'title', filterable: true },
      { id: 'duration', name: 'Duration', field: 'duration', filterable: true, sortable: true },
      { id: '%', name: '% Complete', field: 'percentComplete', filterable: true, sortable: true },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        filterable: true,
        sortable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        filterable: true,
        sortable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'effort-driven',
        name: 'Completed',
        field: 'effortDriven',
        formatter: Formatters.checkmarkMaterial,
        filterable: true,
        sortable: true,
        filter: {
          collection: [
            { value: '', label: '' },
            { value: true, label: 'True' },
            { value: false, label: 'False' },
          ],
          model: Filters.singleSelect,
        },
      },
    ];

    const gridOptions: GridOption = {
      enableAutoResize: true,
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableFiltering: true,
      enableCheckboxSelector: true,
      checkboxSelector: {
        hideSelectAllCheckbox: false, // hide the "Select All" from title bar
        columnIndexPosition: 1,
        // you can toggle these 2 properties to show the "select all" checkbox in different location
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
      },
      enableRowSelection: true,
      rowSelectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: false,
      },
      dataView: {
        syncGridSelection: true, // enable this flag so that the row selection follows the row even if we move it to another position
      },
      enableRowMoveManager: true,
      rowMoveManager: {
        columnIndexPosition: 0,
        // when using Row Move + Row Selection, you want to move only a single row and we will enable the following flags so it doesn't cancel row selection
        singleRowMove: true,
        disableRowSelection: true,
        cancelEditOnDrag: true,
        width: 30,
        onBeforeMoveRows,
        onMoveRows,

        // you can change the move icon position of any extension (RowMove, RowDetail or RowSelector icon)
        // note that you might have to play with the position when using multiple extension
        // since it really depends on which extension get created first to know what their real position are
        // columnIndexPosition: 1,

        // you can also override the usability of the rows, for example make every 2nd row the only moveable rows,
        // usabilityOverride: (row, dataContext, grid) => dataContext.id % 2 === 1
      },
      showCustomFooter: true,
      presets: {
        // you can presets row selection here as well, you can choose 1 of the following 2 ways of setting the selection
        // by their index position in the grid (UI) or by the object IDs, the default is "dataContextIds" and if provided it will use it and disregard "gridRowIndexes"
        // the RECOMMENDED is to use "dataContextIds" since that will always work even with Pagination, while "gridRowIndexes" is only good for 1 page
        rowSelection: {
          // gridRowIndexes: [2],       // the row position of what you see on the screen (UI)
          dataContextIds: [1, 2, 6, 7], // (recommended) select by your data object IDs
        },
      },
    };

    setColumnDefinitions(columnDefinitions);
    setGridOptions(gridOptions);
  }

  function getData() {
    // Set up some test columns.
    const mockDataset: any[] = [];
    for (let i = 0; i < 500; i++) {
      mockDataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 25) + ' days',
        percentComplete: Math.round(Math.random() * 100),
        start: '01/01/2009',
        finish: '01/05/2009',
        effortDriven: i % 5 === 0,
      };
    }
    return mockDataset;
  }

  function onBeforeMoveRows(e: MouseEvent | TouchEvent, data: { rows: number[]; insertBefore: number }) {
    for (const rowIdx of data.rows) {
      // no point in moving before or after itself
      if (
        rowIdx === data.insertBefore ||
        (rowIdx === data.insertBefore - 1 && data.insertBefore - 1 !== reactGridRef.current?.dataView.getItemCount())
      ) {
        e.stopPropagation();
        return false;
      }
    }
    return true;
  }

  function onMoveRows(_e: MouseEvent | TouchEvent, args: any) {
    // rows and insertBefore references,
    // note that these references are assuming that the dataset isn't filtered at all
    // which is not always the case so we will recalcualte them and we won't use these reference afterward
    const rows = args.rows as number[];
    const insertBefore = args.insertBefore;
    const extractedRows: number[] = [];

    // when moving rows, we need to cancel any sorting that might happen
    // we can do this by providing an undefined sort comparer
    // which basically destroys the current sort comparer without resorting the dataset, it basically keeps the previous sorting
    reactGridRef.current?.dataView.sort(undefined as any, true);

    // the dataset might be filtered/sorted,
    // so we need to get the same dataset as the one that the SlickGrid DataView uses
    const tmpDataset = reactGridRef.current?.dataView.getItems() || [];
    const filteredItems = reactGridRef.current?.dataView.getFilteredItems() || [];

    const itemOnRight = reactGridRef.current?.dataView.getItem(insertBefore);
    const insertBeforeFilteredIdx = itemOnRight
      ? reactGridRef.current?.dataView.getIdxById(itemOnRight.id)
      : reactGridRef.current?.dataView.getItemCount();

    const filteredRowItems: any[] = [];
    rows.forEach((row) => filteredRowItems.push(filteredItems[row]));
    const filteredRows = filteredRowItems.map((item) => reactGridRef.current?.dataView.getIdxById(item.id));

    const left = tmpDataset.slice(0, insertBeforeFilteredIdx);
    const right = tmpDataset.slice(insertBeforeFilteredIdx, tmpDataset.length);

    // convert into a final new dataset that has the new order
    // we need to resort with
    rows.sort((a: number, b: number) => a - b);
    for (const filteredRow of filteredRows) {
      if (filteredRow) {
        extractedRows.push(tmpDataset[filteredRow]);
      }
    }
    filteredRows.reverse();
    for (const row of filteredRows) {
      if (row !== undefined && insertBeforeFilteredIdx !== undefined) {
        if (row < insertBeforeFilteredIdx) {
          left.splice(row, 1);
        } else {
          right.splice(row - insertBeforeFilteredIdx, 1);
        }
      }
    }

    // final updated dataset, we need to overwrite the DataView dataset (and our local one) with this new dataset that has a new order
    const finalDataset = left.concat(extractedRows.concat(right));

    setDataset(finalDataset);
  }

  function hideDurationColumnDynamically() {
    // -- you can hide by one Id or multiple Ids:
    // hideColumnById(id, options), hideColumnByIds([ids], options)
    // you can also provide options, defaults are: { autoResizeColumns: true, triggerEvent: true, hideFromColumnPicker: false, hideFromGridMenu: false }

    reactGridRef.current?.gridService.hideColumnById('duration');

    // or with multiple Ids and extra options
    // reactGridRef.current?.gridService.hideColumnByIds(['duration', 'finish'], { hideFromColumnPicker: true, hideFromGridMenu: false });
  }

  // Disable/Enable Filtering/Sorting functionalities
  // --------------------------------------------------

  function disableFilters() {
    reactGridRef.current?.filterService.disableFilterFunctionality(true);
  }

  function disableSorting() {
    reactGridRef.current?.sortService.disableSortFunctionality(true);
  }

  function addEditDeleteColumns() {
    if (columnDefinitions[0].id !== 'change-symbol') {
      const newCols = [
        {
          id: 'change-symbol',
          field: 'id',
          excludeFromColumnPicker: true,
          excludeFromGridMenu: true,
          excludeFromHeaderMenu: true,
          formatter: Formatters.icon,
          params: { iconCssClass: 'mdi mdi-pencil pointer' },
          minWidth: 30,
          maxWidth: 30,
          onCellClick: (clickEvent: Event, args: OnEventArgs) => {
            alert(`Technically we should Edit "Task ${args.dataContext.id}"`);
          },
        },
        {
          id: 'delete-symbol',
          field: 'id',
          excludeFromColumnPicker: true,
          excludeFromGridMenu: true,
          excludeFromHeaderMenu: true,
          formatter: Formatters.icon,
          params: { iconCssClass: 'mdi mdi-trash-can pointer' },
          minWidth: 30,
          maxWidth: 30,
          onCellClick: (e: Event, args: OnEventArgs) => {
            if (confirm('Are you sure?')) {
              reactGridRef.current?.gridService.deleteItemById(args.dataContext.id);
            }
          },
        },
      ];

      // NOTE if you use an Extensions (Checkbox Selector, Row Detail, ...) that modifies the column definitions in any way
      // you MUST use "getAllColumnDefinitions()" from the GridService, using this will be ALL columns including the 1st column that is created internally
      // for example if you use the Checkbox Selector (row selection), you MUST use the code below
      const allColumns = reactGridRef.current?.gridService.getAllColumnDefinitions() || [];
      allColumns.unshift(newCols[0], newCols[1]);
      setColumnDefinitions([...allColumns]); // (or use slice) reassign to column definitions for React to do dirty checking
    }
  }

  // or Toggle Filtering/Sorting functionalities
  // ---------------------------------------------

  function toggleFilter() {
    reactGridRef.current?.filterService.toggleFilterFunctionality();
  }

  function toggleSorting() {
    reactGridRef.current?.sortService.toggleSortFunctionality();
  }

  function toggleSubTitle() {
    const newHideSubTitle = !hideSubTitle;
    setHideSubTitle(newHideSubTitle);
    const action = newHideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    reactGridRef.current?.resizerService.resizeGrid(0);
  }

  return !gridOptions ? (
    ''
  ) : (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 16: Row Move & Checkbox Selector
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example16.tsx"
          >
            <span className="mdi mdi-link-variant"></span> code
          </a>
        </span>
        <button
          className="ms-2 btn btn-outline-secondary btn-sm btn-icon"
          type="button"
          data-test="toggle-subtitle"
          onClick={() => toggleSubTitle()}
        >
          <span className="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
        </button>
      </h2>

      <div className="subtitle">
        This example demonstrates using the <b>SlickRowMoveManager</b> plugin to easily move a row in the grid.
        <br />
        <ul>
          <li>Click to select, Ctrl+Click to toggle selection, Shift+Click to select a range.</li>
          <li>Drag one or more rows by the handle (icon) to reorder</li>
          <li>If you plan to use Row Selection + Row Move, then use "singleRowMove: true" and "disableRowSelection: true"</li>
          <li>You can change "columnIndexPosition" to move the icon position of any extension (RowMove, RowDetail or RowSelector icon)</li>
          <ul>
            <li>You will also want to enable the DataView "syncGridSelection: true" to keep row selection even after a row move</li>
          </ul>
          <li>
            If you plan to use only Row Move, then you could keep default values (or omit them completely) of "singleRowMove: false" and
            "disableRowSelection: false"
          </li>
          <ul>
            <li>
              SingleRowMove has the name suggest will only move 1 row at a time, by default it will move any row(s) that are selected unless
              you disable the flag
            </li>
          </ul>
        </ul>
      </div>

      <div className="row">
        <div className="col-sm-12">
          <button
            className="btn btn-outline-secondary btn-sm btn-icon"
            data-test="hide-duration-btn"
            onClick={() => hideDurationColumnDynamically()}
          >
            <i className="mdi mdi-eye-off-outline me-1"></i>
            Dynamically Hide "Duration"
          </button>
          <button
            className="btn btn-outline-secondary btn-sm btn-icon mx-1"
            data-test="disable-filters-btn"
            onClick={() => disableFilters()}
          >
            <i className="mdi mdi-close me-1"></i>
            Disable Filters
          </button>
          <button className="btn btn-outline-secondary btn-sm btn-icon" data-test="disable-sorting-btn" onClick={() => disableSorting()}>
            <i className="mdi mdi-close me-1"></i>
            Disable Sorting
          </button>
          <button
            className="btn btn-outline-secondary btn-sm btn-icon mx-1"
            data-test="toggle-filtering-btn"
            onClick={() => toggleFilter()}
          >
            <i className="mdi mdi-swap-vertical me-1"></i>
            Toggle Filtering
          </button>
          <button className="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="toggle-sorting-btn" onClick={() => toggleSorting()}>
            <i className="mdi mdi-swap-vertical me-1"></i>
            Toggle Sorting
          </button>
          <button
            className="btn btn-outline-secondary btn-sm btn-icon"
            data-test="add-crud-columns-btn"
            onClick={() => addEditDeleteColumns()}
          >
            <i className="mdi mdi-shape-square-plus me-1"></i>
            Add Edit/Delete Columns
          </button>
        </div>
      </div>

      <br />

      <SlickgridReact
        gridId="grid16"
        columns={columnDefinitions}
        options={gridOptions!}
        dataset={dataset}
        onReactGridCreated={($event) => reactGridReady($event.detail)}
      />
    </div>
  );
};

export default Example16;
