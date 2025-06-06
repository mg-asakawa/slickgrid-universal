##### index
- [Editor Options](#editor-options)
- [Custom Validator](#custom-validator)
- [Date Format](#date-format)
- See the [Editors - Wiki](../Editors.md) for more general info about Editors (validators, event handlers, ...)

### Information
The Date Editor is provided through an external library named [Vanilla-Calendar-Pro](https://vanilla-calendar.pro) and all options from that library can be added to your `options` (see below), so in order to add things like minimum date, disabling dates, ... just review all the [Vanilla-Calendar-Pro](https://vanilla-calendar.pro/docs/reference/additionally/settings) and then add them into `options`. We use [Tempo](https://tempo.formkit.com/) to parse and format Dates to the chosen format (when `type`, `outputType` and/or `saveType` are provided in your column definition)

> **Note** Also just so you know, `options` is used by all other editors as well to expose external library like Autocompleter, Multiple-Select, etc...

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-react/#/example30) | [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example30.tsx)

### Editor Options
You can use any of the Vanilla-Calendar [settings](https://vanilla-calendar.pro/docs/reference/additionally/settings) by adding them to `options` as shown below.

> **Note** for easier implementation, you should import `VanillaCalendarOption` from Slickgrid-Universal common package.

```ts
import { type VanillaCalendarOption } from '@slickgrid-universal/common';

const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);

  useEffect(() => defineGrid(), []);

  function defineGrid() {
    const columnDefinitions = [
      {
        id: 'title', name: 'Title', field: 'title',
        type: 'dateIso', // if your type has hours/minutes, then the date picker will include date+time
        editor: {
          model: Editors.date,
          // previously known as `editorOptions` for < 9.0
          // also vanilla-calendar was previously v2
          // see their migration: https://github.com/uvarov-frontend/vanilla-calendar-pro/wiki/%5BMigration-from-v2.*.*%5D-New-API-for-all-options-and-actions-in-v3.0.0)
          options: {
            displayDateMin: 'today',
            disableDates: ['2022-08-15', '2022-08-20'],
          } as VanillaCalendarOption,
        },
      },
    ];
  }
}
```

#### Grid Option `defaultEditorOptions
You could also define certain options as a global level (for the entire grid or even all grids) by taking advantage of the `defaultEditorOptions` Grid Option. Note that they are set via the editor type as a key name (`autocompleter`, `date`, ...) and then the content is the same as editor `options` (also note that each key is already typed with the correct editor option interface), for example

```ts
const gridOptions = {
  defaultEditorOptions: {
    date: { displayDateMin: 'today' }, // typed as VanillaCalendarOption
  }
}
```

### Custom Validator
You can add a Custom Validator from an external function or inline (inline is shown below and comes from [Example 12](https://ghiscoding.github.io/slickgrid-universal/#/example12))
```ts
const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);

  useEffect(() => defineGrid(), []);

  function defineGrid() {
    const columnDefinitions = [
      {
        id: 'title', name: 'Title', field: 'title',
        editor: {
          model: Editors.date,
          required: true,
          validator: (value, args) => {
            const dataContext = args && args.item;
            if (dataContext && (dataContext.completed && !value)) {
              return { valid: false, msg: 'You must provide a "Finish" date when "Completed" is checked.' };
            }
            return { valid: true, msg: '' };
          }
        },
      },
    ];
  }
}
```

### Date Format
Your column definitions may include a `type` to tell Formatters how to formate your date, this `type` is also used by the Editor when saving.

##### What if I want to use a different format when saving?
There are 3 types you can provide to inform the Editor on how to save:
1. `type` inform the entire column what its type is (used by Formatter, Filter, Editor, Export)
2. `outputType` what type to display in the Editor vs saving format.
3. `saveOutputType` the type to use when saving which is different than the one used on cell input (rarely used).


The `type` and `outputType` are often used when you want to save something different compare to what you show to the user (for example, show a date in the US Format but save it as ISO or UTC).

The difference between `outputType` and `saveOutputType` when you wish to display a certain format in the date editor input (while editing), but wish to save in a different format. You will rarely need the `saveOutputType` and for most use cases, the use of both `type` and `outputType` should be enough.

> **Note** the type detection when saving is the inverse of the list above, whichever comes first from 3 to 1.
