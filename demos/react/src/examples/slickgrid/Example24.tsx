import { ExcelExportService } from '@slickgrid-universal/excel-export';
import i18next from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { withTranslation } from 'react-i18next';

import {
  type Column,
  type ContextMenu,
  ExtensionName,
  Filters,
  type Formatter,
  Formatters,
  type GridOption,
  type SlickGrid,
  SlickgridReact,
  type SlickgridReactInstance,
} from 'slickgrid-react';

import './example24.scss'; // provide custom CSS/SASS styling

const actionFormatter: Formatter = (_row, _cell, _value, _columnDef, dataContext) => {
  if (dataContext.priority === 3) {
    // option 3 is High
    return `<div class="cell-menu-dropdown-outline">Action<i class="mdi mdi-chevron-down"></i></div>`;
  }
  return `<div class="cell-menu-dropdown-outline disabled">Action <i class="mdi mdi-chevron-down"></i></div>`;
};

const priorityFormatter: Formatter = (_row, _cell, value) => {
  if (!value) {
    return '';
  }
  let output = '';
  const count = +(value >= 3 ? 3 : value);
  const color = count === 3 ? 'red' : count === 2 ? 'orange' : 'yellow';
  const icon = `<i class="mdi mdi-star ${color}" aria-hidden="true"></i>`;

  for (let i = 1; i <= count; i++) {
    output += icon;
  }
  return output;
};

const priorityExportFormatter: Formatter = (_row, _cell, value, _columnDef, _dataContext, grid) => {
  if (!value) {
    return '';
  }
  const gridOptions = grid.getOptions() as GridOption;
  const i18n = gridOptions.i18n;
  const count = +(value >= 3 ? 3 : value);
  const key = count === 3 ? 'HIGH' : count === 2 ? 'MEDIUM' : 'LOW';

  return i18n?.t(key) ?? '';
};

// create a custom translate Formatter (typically you would move that a separate file, for separation of concerns)
const taskTranslateFormatter: Formatter = (_row, _cell, value, _columnDef, _dataContext, grid: SlickGrid) => {
  const gridOptions = grid.getOptions() as GridOption;
  const i18n = gridOptions.i18n;

  return i18n?.t('TASK_X', { x: value }) ?? '';
};

const Example24: React.FC = () => {
  const defaultLang = 'en';
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [dataset] = useState<any[]>(getData(1000));
  const [darkMode, setDarkMode] = useState(false);
  const [hideSubTitle, setHideSubTitle] = useState(false);
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(defaultLang);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => {
    i18next.changeLanguage(defaultLang);
    defineGrid();

    // make sure it's back to light mode before unmounting
    return () => {
      document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
    };
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function cellMenuInstance() {
    return reactGridRef.current?.extensionService.getExtensionInstanceByName(ExtensionName.cellMenu);
  }

  function contextMenuInstance() {
    return reactGridRef.current?.extensionService.getExtensionInstanceByName(ExtensionName.contextMenu);
  }

  /* Define grid Options and Columns */
  function defineGrid() {
    const columnDefinitions: Column[] = [
      { id: 'id', name: '#', field: 'id', maxWidth: 45, sortable: true, filterable: true },
      {
        id: 'title',
        name: 'Title',
        field: 'id',
        nameKey: 'TITLE',
        minWidth: 100,
        formatter: taskTranslateFormatter,
        sortable: true,
        filterable: true,
        params: { useFormatterOuputToFilter: true },
      },
      {
        id: 'percentComplete',
        nameKey: 'PERCENT_COMPLETE',
        field: 'percentComplete',
        minWidth: 100,
        exportWithFormatter: false,
        sortable: true,
        filterable: true,
        filter: { model: Filters.slider, operator: '>=' },
        formatter: Formatters.percentCompleteBar,
        type: 'number',
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        nameKey: 'START',
        minWidth: 100,
        formatter: Formatters.dateIso,
        outputType: 'dateIso',
        type: 'date',
        filterable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        nameKey: 'FINISH',
        formatter: Formatters.dateIso,
        outputType: 'dateIso',
        type: 'date',
        minWidth: 100,
        filterable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'priority',
        nameKey: 'PRIORITY',
        field: 'priority',
        exportCustomFormatter: priorityExportFormatter,
        formatter: priorityFormatter,
        sortable: true,
        filterable: true,
        filter: {
          collection: [
            { value: '', label: '' },
            { value: 1, labelKey: 'LOW' },
            { value: 2, labelKey: 'MEDIUM' },
            { value: 3, labelKey: 'HIGH' },
          ],
          model: Filters.singleSelect,
          enableTranslateLabel: true,
        },
      },
      {
        id: 'completed',
        nameKey: 'COMPLETED',
        field: 'completed',
        exportCustomFormatter: Formatters.translateBoolean,
        formatter: Formatters.checkmarkMaterial,
        sortable: true,
        filterable: true,
        filter: {
          collection: [
            { value: '', label: '' },
            { value: true, labelKey: 'TRUE' },
            { value: false, labelKey: 'FALSE' },
          ],
          model: Filters.singleSelect,
          enableTranslateLabel: true,
        },
      },
      {
        id: 'action',
        name: 'Action',
        field: 'action',
        width: 100,
        maxWidth: 110,
        excludeFromExport: true,
        formatter: actionFormatter,
        cellMenu: {
          hideCloseButton: false,
          // you can override the logic of when the menu is usable
          // for example say that we want to show a menu only when then Priority is set to 'High'.
          // Note that this ONLY overrides the usability itself NOT the text displayed in the cell,
          // if you wish to change the cell text (or hide it)
          // then you SHOULD use it in combination with a custom formatter (actionFormatter) and use the same logic in that formatter
          menuUsabilityOverride: (args) => {
            return args.dataContext.priority === 3; // option 3 is High
          },

          // when using Translate Service, every translation will have the suffix "Key"
          // else use title without the suffix, for example "commandTitle" (no translations) or "commandTitleKey" (with translations)
          commandTitleKey: 'COMMANDS', // optional title, use "commandTitle" when not using I18N
          commandItems: [
            // array of command item objects, you can also use the "positionOrder" that will be used to sort the items in the list
            {
              command: 'command2',
              title: 'Command 2',
              positionOrder: 62,
              // you can use the "action" callback and/or use "onCallback" callback from the grid options, they both have the same arguments
              action: (_e, args) => {
                console.log(args.dataContext, args.column);
                // action callback.. do something
              },
              // only enable command when the task is not completed
              itemUsabilityOverride: (args) => {
                return !args.dataContext.completed;
              },
            },
            { command: 'command1', title: 'Command 1', cssClass: 'orange', positionOrder: 61 },
            {
              command: 'delete-row',
              titleKey: 'DELETE_ROW',
              positionOrder: 64,
              iconCssClass: 'mdi mdi-close',
              cssClass: 'red',
              textCssClass: 'bold',
              // only show command to 'Delete Row' when the task is not completed
              itemVisibilityOverride: (args) => {
                return !args.dataContext.completed;
              },
            },
            // you can pass divider as a string or an object with a boolean (if sorting by position, then use the object)
            // note you should use the "divider" string only when items array is already sorted and positionOrder are not specified
            { divider: true, command: '', positionOrder: 63 },
            // 'divider',

            {
              command: 'help',
              titleKey: 'HELP', // use "title" without translation and "titleKey" with TranslateService
              iconCssClass: 'mdi mdi-help-circle',
              positionOrder: 66,
            },
            { command: 'something', titleKey: 'DISABLED_COMMAND', disabled: true, positionOrder: 67 },
            { command: '', divider: true, positionOrder: 98 },
            {
              // we can also have multiple nested sub-menus
              command: 'export',
              title: 'Exports',
              positionOrder: 99,
              commandItems: [
                { command: 'exports-txt', title: 'Text (tab delimited)' },
                {
                  command: 'sub-menu',
                  title: 'Excel',
                  cssClass: 'green',
                  subMenuTitle: 'available formats',
                  subMenuTitleCssClass: 'text-italic orange',
                  commandItems: [
                    { command: 'exports-csv', title: 'Excel (csv)' },
                    { command: 'exports-xlsx', title: 'Excel (xlsx)' },
                  ],
                },
              ],
            },
            {
              command: 'feedback',
              title: 'Feedback',
              positionOrder: 100,
              commandItems: [
                {
                  command: 'request-update',
                  title: 'Request update from supplier',
                  iconCssClass: 'mdi mdi-star',
                  tooltip: 'this will automatically send an alert to the shipping team to contact the user for an update',
                },
                'divider',
                {
                  command: 'sub-menu',
                  title: 'Contact Us',
                  iconCssClass: 'mdi mdi-account',
                  subMenuTitle: 'contact us...',
                  subMenuTitleCssClass: 'italic',
                  commandItems: [
                    { command: 'contact-email', title: 'Email us', iconCssClass: 'mdi mdi-pencil-outline' },
                    { command: 'contact-chat', title: 'Chat with us', iconCssClass: 'mdi mdi-message-text-outline' },
                    { command: 'contact-meeting', title: 'Book an appointment', iconCssClass: 'mdi mdi-coffee' },
                  ],
                },
              ],
            },
          ],
          optionTitleKey: 'CHANGE_COMPLETED_FLAG',
          optionItems: [
            { option: true, titleKey: 'TRUE', iconCssClass: 'mdi mdi-check-box-outline' },
            { option: false, titleKey: 'FALSE', iconCssClass: 'mdi mdi-checkbox-blank-outline' },
            {
              option: null,
              title: 'null',
              cssClass: 'italic',
              // you can use the "action" callback and/or use "onCallback" callback from the grid options, they both have the same arguments
              action: () => {
                // action callback.. do something
              },
              // only enable Action menu when the Priority is set to High
              itemUsabilityOverride: (args) => {
                return args.dataContext.priority === 3;
              },
              // only show command to 'Delete Row' when the task is not completed
              itemVisibilityOverride: (args) => {
                return !args.dataContext.completed;
              },
            },
          ],
        },
      },
    ];

    const gridOptions: GridOption = {
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      darkMode,
      enableCellNavigation: true,
      enableFiltering: true,
      enableSorting: true,
      enableTranslate: true,
      enableExcelExport: true,
      excelExportOptions: {
        exportWithFormatter: true,
        customColumnWidth: 15,

        // you can customize how the header titles will be styled (defaults to Bold)
        columnHeaderStyle: { font: { bold: true, italic: true } },
      },
      externalResources: [new ExcelExportService()],
      i18n: i18next,

      enableContextMenu: true,
      enableCellMenu: true,

      // when using the cellMenu, you can change some of the default options and all use some of the callback methods
      cellMenu: {
        // all the Cell Menu callback methods (except the action callback)
        // are available under the grid options as shown below
        onCommand: (_e, args) => executeCommand(_e, args),
        onOptionSelected: (_e, args) => {
          // change "Completed" property with new option selected from the Cell Menu
          const dataContext = args && args.dataContext;
          if (dataContext && dataContext.hasOwnProperty('completed')) {
            dataContext.completed = args.item.option;
            reactGridRef.current?.gridService.updateItem(dataContext);
          }
        },
        onBeforeMenuShow: (_e, args) => {
          // for example, you could select the row that the click originated
          // reactGridRef.current?.gridService.setSelectedRows([args.row]);
          console.log('Before the Cell Menu is shown', args);
        },
        onBeforeMenuClose: (_e, args) => console.log('Cell Menu is closing', args),
      },

      // load Context Menu structure
      contextMenu: getContextMenuOptions(),
    };

    setColumnDefinitions(columnDefinitions);
    setGridOptions(gridOptions);
  }

  function executeCommand(_e: any, args: any) {
    const command = args.command;
    const dataContext = args.dataContext;

    switch (command) {
      case 'contact-email':
      case 'contact-chat':
      case 'contact-meeting':
        alert('Command: ' + args?.command);
        break;
      case 'exports-csv':
      case 'exports-txt':
      case 'exports-xlsx':
        alert(`Exporting as ${args.item.title}`);
        break;
      case 'command1':
        alert('Command 1');
        break;
      case 'command2':
        alert('Command 2');
        break;
      case 'help':
        alert('Please help!');
        break;
      case 'delete-row':
        if (confirm(`Do you really want to delete row ${args.row + 1} with ${i18next?.t('TASK_X', { x: dataContext.id })}`)) {
          reactGridRef.current?.dataView.deleteItem(dataContext.id);
        }
        break;
    }
  }

  function getData(count: number): any[] {
    // mock a dataset
    const tmpData: any[] = [];
    for (let i = 0; i < count; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 30);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);

      tmpData[i] = {
        id: i,
        duration: Math.floor(Math.random() * 25) + ' days',
        percentComplete: Math.floor(Math.random() * 100),
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, randomMonth + 1, randomDay),
        priority: i % 3 ? 2 : i % 5 ? 3 : 1,
        completed: i % 4 === 0,
      };
    }
    return tmpData;
  }

  function getContextMenuOptions(): ContextMenu {
    return {
      hideCloseButton: false,
      // optionally and conditionally define when the the menu is usable,
      // this should be used with a custom formatter to show/hide/disable the menu
      menuUsabilityOverride: (args) => {
        const dataContext = args && args.dataContext;
        return dataContext.id < 21; // say we want to display the menu only from Task 0 to 20
      },
      // which column to show the command list? when not defined it will be shown over all columns
      commandShownOverColumnIds: ['id', 'title', 'percentComplete', 'start', 'finish', 'completed' /* , 'priority', 'action' */],
      commandTitleKey: 'COMMANDS', // this title is optional, you could also use "commandTitle" when not using I18N
      commandItems: [
        { divider: true, command: '', positionOrder: 61 },
        {
          command: 'delete-row',
          titleKey: 'DELETE_ROW',
          iconCssClass: 'mdi mdi-close',
          cssClass: 'red',
          textCssClass: 'bold',
          positionOrder: 62,
        },
        // you can pass divider as a string or an object with a boolean (if sorting by position, then use the object)
        // note you should use the "divider" string only when items array is already sorted and positionOrder are not specified
        // 'divider',
        { divider: true, command: '', positionOrder: 63 },
        {
          command: 'help',
          titleKey: 'HELP',
          iconCssClass: 'mdi mdi-help-circle',
          positionOrder: 64,
          // you can use the 'action' callback and/or subscribe to the 'onCallback' event, they both have the same arguments
          action: () => {
            // action callback.. do something
          },
          // only show command to 'Help' when the task is Not Completed
          itemVisibilityOverride: (args) => {
            const dataContext = args && args.dataContext;
            return !dataContext.completed;
          },
        },
        { command: 'something', titleKey: 'DISABLED_COMMAND', disabled: true, positionOrder: 65 },
        { command: '', divider: true, positionOrder: 98 },
        {
          // we can also have multiple nested sub-menus
          command: 'export',
          title: 'Exports',
          positionOrder: 99,
          commandItems: [
            { command: 'exports-txt', title: 'Text (tab delimited)' },
            {
              command: 'sub-menu',
              title: 'Excel',
              cssClass: 'green',
              subMenuTitle: 'available formats',
              subMenuTitleCssClass: 'text-italic orange',
              commandItems: [
                { command: 'exports-csv', title: 'Excel (csv)' },
                { command: 'exports-xlsx', title: 'Excel (xlsx)' },
              ],
            },
          ],
        },
        {
          command: 'feedback',
          title: 'Feedback',
          positionOrder: 100,
          commandItems: [
            {
              command: 'request-update',
              title: 'Request update from supplier',
              iconCssClass: 'mdi mdi-star',
              tooltip: 'this will automatically send an alert to the shipping team to contact the user for an update',
            },
            'divider',
            {
              command: 'sub-menu',
              title: 'Contact Us',
              iconCssClass: 'mdi mdi-account',
              subMenuTitle: 'contact us...',
              subMenuTitleCssClass: 'italic',
              commandItems: [
                { command: 'contact-email', title: 'Email us', iconCssClass: 'mdi mdi-pencil-outline' },
                { command: 'contact-chat', title: 'Chat with us', iconCssClass: 'mdi mdi-message-text-outline' },
                { command: 'contact-meeting', title: 'Book an appointment', iconCssClass: 'mdi mdi-coffee' },
              ],
            },
          ],
        },
      ],

      // Options allows you to edit a column from an option chose a list
      // for example, changing the Priority value
      // you can also optionally define an array of column ids that you wish to display this option list (when not defined it will show over all columns)
      optionTitleKey: 'CHANGE_PRIORITY',
      optionShownOverColumnIds: ['priority'], // optional, when defined it will only show over the columns (column id) defined in the array
      optionItems: [
        {
          option: 0,
          title: 'n/a',
          textCssClass: 'italic',
          // only enable this option when the task is Not Completed
          itemUsabilityOverride: (args) => {
            const dataContext = args && args.dataContext;
            return !dataContext.completed;
          },
          // you can use the 'action' callback and/or subscribe to the 'onCallback' event, they both have the same arguments
          action: () => {
            // action callback.. do something
          },
        },
        { option: 1, iconCssClass: 'mdi mdi-star-outline yellow', titleKey: 'LOW' },
        { option: 2, iconCssClass: 'mdi mdi-star orange', titleKey: 'MEDIUM' },
        { option: 3, iconCssClass: 'mdi mdi-star red', titleKey: 'HIGH' },
        // you can pass divider as a string or an object with a boolean (if sorting by position, then use the object)
        // note you should use the "divider" string only when items array is already sorted and positionOrder are not specified
        'divider',
        // { divider: true, option: '', positionOrder: 3 },
        {
          option: 4,
          title: 'Extreme',
          iconCssClass: 'mdi mdi-fire',
          disabled: true,
          // only shown when the task is Not Completed
          itemVisibilityOverride: (args) => {
            const dataContext = args && args.dataContext;
            return !dataContext.completed;
          },
        },
        {
          // we can also have multiple nested sub-menus
          option: null,
          title: 'Sub-Options (demo)',
          subMenuTitleKey: 'CHANGE_PRIORITY',
          optionItems: [
            { option: 1, iconCssClass: 'mdi mdi-star-outline yellow', titleKey: 'LOW' },
            { option: 2, iconCssClass: 'mdi mdi-star orange', titleKey: 'MEDIUM' },
            { option: 3, iconCssClass: 'mdi mdi-star red', titleKey: 'HIGH' },
          ],
        },
      ],
      // subscribe to Context Menu
      onBeforeMenuShow: (_e, args) => {
        // for example, you could select the row it was clicked with
        // grid.setSelectedRows([args.row]); // select the entire row
        reactGridRef.current?.slickGrid.setActiveCell(args.row, args.cell, false); // select the cell that the click originated
        console.log('Before the global Context Menu is shown', args);
      },
      onBeforeMenuClose: (_e, args) => console.log('Global Context Menu is closing', args),

      // subscribe to Context Menu onCommand event (or use the action callback on each command)
      onCommand: (_e, args) => executeCommand(_e, args),

      // subscribe to Context Menu onOptionSelected event (or use the action callback on each option)
      onOptionSelected: (_e, args) => {
        // change Priority
        const dataContext = args && args.dataContext;
        if (dataContext && dataContext.hasOwnProperty('priority')) {
          dataContext.priority = args.item.option;
          reactGridRef.current?.gridService.updateItem(dataContext);
        }
      },
    };
  }

  function showContextCommandsAndOptions(showBothList: boolean) {
    // when showing both Commands/Options, we can just pass an empty array to show over all columns
    // else show on all columns except Priority
    const showOverColumnIds = showBothList ? [] : ['id', 'title', 'complete', 'start', 'finish', 'completed', 'action'];
    contextMenuInstance()?.setOptions({
      commandShownOverColumnIds: showOverColumnIds,
      // hideCommandSection: !showBothList
    });
  }

  function showCellMenuCommandsAndOptions(showBothList: boolean) {
    // change via the plugin setOptions
    cellMenuInstance()?.setOptions({
      hideOptionSection: !showBothList,
    });

    // OR find the column, then change the same hide property
    // var actionColumn = columns.find(function (column) { return column.id === 'action' });
    // actionColumn.cellMenu.hideOptionSection = !showBothList;
  }

  async function switchLanguage() {
    const nextLanguage = selectedLanguage === 'en' ? 'fr' : 'en';
    await i18next.changeLanguage(nextLanguage);
    setSelectedLanguage(nextLanguage);
  }

  function toggleDarkMode() {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    toggleBodyBackground(newDarkMode);
    reactGridRef.current?.slickGrid.setOptions({ darkMode: newDarkMode });
  }

  function toggleBodyBackground(darkMode: boolean) {
    if (darkMode) {
      document.querySelector<HTMLDivElement>('.panel-wm-content')!.classList.add('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'dark';
    } else {
      document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
    }
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
    <div id="demo-container" className="container-fluid grid24">
      <h2>
        Example 24: Cell Menu & Context Menu Plugins
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example24.tsx"
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
          <span className="mdi mdi-information-outline" title="Toggle sub-title text"></span>
        </button>
        <button className="btn btn-outline-secondary btn-sm btn-icon ms-2" data-test="toggle-dark-mode" onClick={() => toggleDarkMode()}>
          <i className="mdi mdi-theme-light-dark"></i>
          <span>Toggle Dark Mode</span>
        </button>
      </h2>

      <div className="subtitle">
        <ul>
          <li>
            This example demonstrates 2 SlickGrid plugins (<b>SlickCellMenu</b> for plugin Action Menu (see{' '}
            <a href="https://ghiscoding.gitbook.io/slickgrid-react/grid-functionalities/cell-menu" target="_blank">
              Docs
            </a>
            ),
            <b>SlickContextMenu</b> plugin (see{' '}
            <a href="https://ghiscoding.gitbook.io/slickgrid-react/grid-functionalities/context-menu" target="_blank">
              Docs
            </a>
            )).
          </li>
          <li>It will also "autoAdjustDrop" (bottom/top) and "autoAlignSide" (left/right) by default but could be turned off</li>
          <li>
            Both plugins have 2 sections, 1st section can have an array of Options (to change value of a field) and 2nd section an array of
            Commands (execute a command)
          </li>
          <li>There are 2 ways to execute a Command/Option</li>
          <ol>
            <li>via onCommand/onOptionSelected (use a switch/case to parse command/option and do something with it)</li>
            <li>via action callback (that can be defined on each command/option)</li>
          </ol>
          <li>
            Use override callback functions to change the properties of show/hide, enable/disable the menu or certain item(s) from the list
          </li>
          <ol>
            <li>These callbacks are: "menuUsabilityOverride", "itemVisibilityOverride", "itemUsabilityOverride"</li>
            <li>
              ... e.g. in the demo, the "Action" Cell Menu is only available when Priority is set to "High" via "menuUsabilityOverride"
            </li>
            <li>... e.g. in the demo, the Context Menu is only available on the first 20 Tasks via "menuUsabilityOverride"</li>
          </ol>
        </ul>
      </div>

      <div className="row">
        <span className="context-menu d-flex gap-4px">
          <strong>Context Menu:</strong>
          <button
            className="btn btn-outline-secondary btn-xs btn-icon"
            onClick={() => showContextCommandsAndOptions(false)}
            data-test="context-menu-priority-only-button"
          >
            Show Priority Options Only
          </button>
          <button
            className="btn btn-outline-secondary btn-xs btn-icon"
            onClick={() => showContextCommandsAndOptions(true)}
            data-test="context-menu-commands-and-priority-button"
          >
            Show Commands & Priority Options
          </button>
        </span>

        <span className="cell-menu d-flex gap-4px">
          <strong>Cell Menu:</strong>
          <button
            className="btn btn-outline-secondary btn-xs btn-icon"
            onClick={() => showCellMenuCommandsAndOptions(false)}
            data-test="cell-menu-commands-and-options-false-button"
          >
            Show Action Commands Only
          </button>
          <button
            className="btn btn-outline-secondary btn-xs btn-icon"
            onClick={() => showCellMenuCommandsAndOptions(true)}
            data-test="cell-menu-commands-and-options-true-button"
          >
            Show Actions Commands & Completed Options
          </button>
        </span>
      </div>

      <div className="row locale">
        <div className="col-12">
          <button className="btn btn-outline-secondary btn-xs btn-icon me-1" onClick={() => switchLanguage()} data-test="language-button">
            <i className="mdi mdi-translate me-1"></i>
            Switch Language
          </button>
          <label>Locale: </label>
          <span style={{ fontStyle: 'italic' }} data-test="selected-locale">
            {selectedLanguage + '.json'}
          </span>
        </div>
      </div>

      <SlickgridReact
        gridId="grid24"
        columns={columnDefinitions}
        options={gridOptions}
        dataset={dataset}
        onReactGridCreated={($event) => reactGridReady($event.detail)}
      />
    </div>
  );
};

export default withTranslation()(Example24);
