# zodcli

A CLI parser built with Zod.

## Getting Started

```
npm install --save zodcli zod
```

```ts
import { z } from "zod";
import { argumentParser } from "zodcli";

argumentParser({ options: z.object({ foo: z.string() }).strict() }).parse([
	"--foo=bar",
]);
```

### Using in a CLI

You can get CLI arguments passed to the script by using `process.argv.slice(2)`:

```ts
// ./cli.js

import { z } from "zod";
import { argumentParser } from "./dist/index.js";

console.log(
	argumentParser({ options: z.object({ foo: z.string() }).strict() }).parse(
		process.argv.slice(2)
	)
);

// $ node cli.js --foo=bar
// { foo: 'bar' }
```

## API

### `argumentParser`

`argumentParser` is a function which takes an object with the following properties: [`options`](#options) and [`aliases`](#aliases).

#### `options`

`options` is a required property and **must** have a value of a strict Zod object (`z.object({}).strict()`). This ensures that any unrecognized arguments are rejected.

- All properties **must** be in ['camelCase'](https://en.wikipedia.org/wiki/Camel_case) and be exclusively composed of a-z characters. For example:

  - Valid:
    - `foo`
    - `catDog`
  - Invalid:
    - `Foo`
    - `cat_dog`
    - `5`
    - `a5`

  When parsed, ['--kebab-case'](https://en.wikipedia.org/wiki/Letter_case#Kebab_case) arguments are converted to their respective 'camelCase' properties.

  For example:

  ```ts
  import { z } from "zod";
  import { argumentParser } from "zodcli";

  const options = z
  	.object({
  		foo: z.string(),
  		catDog: z.string(),
  	})
  	.strict();

  const result = argumentParser({
  	options,
  }).parse(["--foo=bar", "--cat-dog=fish"]);

  console.log(result);
  // { foo: 'bar', catDog: 'fish' }
  ```

- All values **must** be one of the following Zod types:

  - [`z.literal()`](https://zod.dev/?id=literals)
  - [`z.string()`](https://zod.dev/?id=strings)
  - [`z.number()`](https://zod.dev/?id=numbers)
  - [`z.null()`](https://zod.dev/?id=primitives)

  And these values can be modified/wrapped with any of the following:

  - [`.transform()`](https://zod.dev/?id=transform)
  - [`.optional()`](https://zod.dev/?id=optional)
  - [`.default()`](https://zod.dev/?id=default)
  - [`z.union()`](https://zod.dev/?id=unions)
  - [`z.array()`](https://zod.dev/?id=arrays)

#### `aliases`

`aliases` is an optional property which allows you to configure argument aliases for options. It is an object where: the properties are lowercase and composed of exclusively a-z charaters; and the values are 'camelCase' strings and appear as properties in the [`options`](#options) object.

## Tips and Tricks

### Parsing

Parsing requires an explict `=` between the argument name and its value. For example:

- Valid:
  - `--foo=bar --cat-dog=fish`
- Invalid:
  - `--foo bar --cat-dog fish`

### Implicit Booleans

If an argument value is omitted, it will be set as `null`. You can use this to accept implicit booleans (boolean arguments whose presence implies `true`) by using a `z.union()`. For example:

```ts
import { z } from "zod";
import { argumentParser } from "zodcli";

const options = z
	.object({
		foo: z
			.union([
				z.literal("true").transform(() => true),
				z.literal("false").transform(() => false),
				z.null().transform(() => true),
			])
			.default("false"),
	})
	.strict();

const result = argumentParser({
	options,
}).parse(["--foo"]);

console.log(result);
// { foo: true }
```

### Optional Options

You can make options optional by using the [`.optional()`](https://zod.dev/?id=optionals) modifier. For example:

```ts
import { z } from "zod";
import { argumentParser } from "zodcli";

const options = z
	.object({
		foo: z.string(),
		catDog: z.string().optional(),
	})
	.strict();

const result = argumentParser({
	options,
}).parse(["--foo=bar"]);

console.log(result);
// { foo: 'bar' }
```

Or, to make all options optional, you can use [`.partial()`](https://zod.dev/?id=partial) on the object. For example:

```ts
import { z } from "zod";
import { argumentParser } from "zodcli";

const options = z
	.object({
		foo: z.string(),
		catDog: z.string(),
	})
	.partial()
	.strict();

const result = argumentParser({
	options,
}).parse(["--foo=bar"]);

console.log(result);
// { foo: 'bar' }
```

Note, however, that for booleans, you will likely want to keep them required and simply provide a `.default()` false value. For example:

```ts
import { z } from "zod";
import { argumentParser } from "zodcli";

const options = z
	.object({
		foo: z
			.union([
				z.literal("true").transform(() => true),
				z.literal("false").transform(() => false),
				z.null().transform(() => true),
			])
			.default("false"),
		catDog: z.string(),
	})
	.partial()
	.required({ foo: true })
	.strict();

const result = argumentParser({
	options,
}).parse([]);

console.log(result);
// { foo: false }
```

### Coercion

You can [coerce non-string values using Zod](https://zod.dev/?id=coercion-for-primitives). For example:

```ts
import { z } from "zod";
import { argumentParser } from "zodcli";

const options = z
	.object({
		foo: z.coerce.number(),
	})
	.strict();

const result = argumentParser({
	options,
}).parse(["--foo=2.2"]);

console.log(result);
// { foo: 2.2 }
```

## Roadmap

- [ ] Help message
- [ ] Commands support
- [ ] Positionals support
- [ ] Object support
- [x] Strict typing of aliases
- [ ] Improve optionality/booleans
