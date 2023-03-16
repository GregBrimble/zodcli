import {
	AnyZodObject,
	z,
	ZodArray,
	ZodDefault,
	ZodEffects,
	ZodLiteral,
	ZodNull,
	ZodNumber,
	ZodObject,
	ZodOptional,
	ZodString,
	ZodUnion,
} from "zod";

export const booleanArgument = z.union([
	z.literal("true").transform(() => true),
	z.literal("false").transform(() => false),
	z.null().transform(() => true),
]);

type LowercaseLetters =
	| "a"
	| "b"
	| "c"
	| "d"
	| "e"
	| "f"
	| "g"
	| "h"
	| "i"
	| "j"
	| "k"
	| "l"
	| "m"
	| "n"
	| "o"
	| "p"
	| "q"
	| "r"
	| "s"
	| "t"
	| "u"
	| "v"
	| "w"
	| "x"
	| "y"
	| "z";

type CamelCaseLetters<String> = String extends `${infer Left}${infer Right}`
	? Left extends LowercaseLetters
		? `${Left}${OnlyLetters<Right>}`
		: never
	: String;

type OnlyLetters<String> = String extends `${infer Left}${infer Right}`
	? Lowercase<Left> extends LowercaseLetters
		? `${Left}${OnlyLetters<Right>}`
		: never
	: String;

type OnlyLowercaseLetters<String> = String extends `${infer Left}${infer Right}`
	? Left extends LowercaseLetters
		? `${Left}${OnlyLowercaseLetters<Right>}`
		: never
	: String;

type ObjectWithPropertiesOfCamelCaseLetters<T> = {
	[K in keyof T as CamelCaseLetters<string & K>]: T[K];
};

type ObjectWithPropertiesOfLowercaseLetters<T> = {
	[K in keyof T as OnlyLowercaseLetters<string & K>]: T[K];
};

type ObjectWithPropertiesNotInAnother<T, U> = {
	[K in keyof T as K extends keyof U ? never : K]: T[K];
};

type ObjectWithOnlyTheseProperties<T, U extends keyof T> = Pick<T, U> &
	Record<Exclude<keyof T, U>, never>;

type ZodObjectWithOnlyTheseProperties<
	T extends AnyZodObject,
	U extends PropertyKey
> = ZodObject<ObjectWithOnlyTheseProperties<T["shape"], U>>;

type ObjectWithOnlyPropertiesOfLowercaseLetters<T extends any> =
	ObjectWithOnlyTheseProperties<
		T,
		keyof ObjectWithPropertiesOfLowercaseLetters<T>
	>;

type ZodObjectWithOnlyPropertiesOfCamelCaseLetters<T extends AnyZodObject> =
	ZodObjectWithOnlyTheseProperties<
		T,
		keyof ObjectWithPropertiesOfCamelCaseLetters<T["shape"]>
	>;

type SupportedZodTypes =
	| ZodString
	| ZodNumber
	| ZodLiteral<string | number>
	| ZodNull
	| ZodEffects<SupportedZodTypes, any, any>
	| ZodArray<SupportedZodTypes>
	| ZodUnion<[SupportedZodTypes, ...SupportedZodTypes[]]>
	| ZodOptional<SupportedZodTypes>
	| ZodDefault<SupportedZodTypes>;

type SomeObject<T> = {
	[K in keyof T]: T[K];
};

export const argumentParser = <
	// @ts-expect-error
	Options extends ZodObjectWithOnlyPropertiesOfCamelCaseLetters<
		Options extends ZodObject<
			{
				[key: PropertyKey]: SupportedZodTypes;
			},
			"strict"
		>
			? Options
			: never
	>,
	Aliases extends SomeObject<
		Aliases extends ObjectWithOnlyPropertiesOfLowercaseLetters<Aliases>
			? { [key: PropertyKey]: string & keyof Options["shape"] }
			: never
	>
>({
	options,
	aliases,
}: {
	options: Options;
	aliases?: Aliases;
}) => {
	return z.array(z.string()).transform((argv, ctx) => {
		const rawResults: Record<string, string[]> = {};

		const unknownKeys = [];

		for (let i = 0; i < argv.length; i++) {
			const arg = argv[i];

			let key: string;
			let value: string | null;

			if (arg.startsWith("-")) {
				if (arg.startsWith("--")) {
					const parts = arg.slice("--".length).split("=", 2);
					const kebabCaseKey = parts[0];
					value = parts[1] ?? null;

					if (kebabCaseKey.match(/^[^a-z-]$/)) {
						// Unexpected non-lowercase characters in the argument name.
						unknownKeys.push(arg);
						continue;
					}

					key = kebabCaseKey.replace(/-(\w)/g, (_, firstLetter) =>
						firstLetter.toUpperCase()
					);
				} else if (arg.startsWith("-")) {
					// Aliases
					const parts = arg.slice("-".length).split("=", 2);
					const alias = parts[0];
					value = parts[1] ?? null;

					if (alias.match(/^[^a-z]$/)) {
						// Unexpected non-lowercase characters in the argument name.
						unknownKeys.push(arg);
						continue;
					}

					if (!(alias in aliases)) {
						// No such alias.
						unknownKeys.push(arg);
						continue;
					}

					key = aliases[alias];
				}

				if (key.match(/[^a-zA-Z]/)) {
					// Unexpected non-lowercase characters in the argument name.
					unknownKeys.push(arg);
					continue;
				}

				if (!(key in options.shape)) {
					// No such argument.
					unknownKeys.push(arg);
					continue;
				}

				if (key in rawResults) {
					rawResults[key].push(value);
				} else {
					rawResults[key] = [value];
				}
			} else {
				// TODO: Positionals
				unknownKeys.push(arg);
				continue;
			}
		}

		if (unknownKeys.length > 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.unrecognized_keys,
				keys: unknownKeys,
			});
		}

		const results: Record<string, string[] | string> = {};

		for (const key in rawResults) {
			let zodType = options.shape[key];
			if ("unwrap" in zodType) {
				zodType = zodType.unwrap();
			}
			const isSupposedToBeAnArray = zodType instanceof z.ZodArray;
			if (!isSupposedToBeAnArray && rawResults[key].length > 1) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Cannot parse argument: \`${key}\`. Unexpected multiple values: ${rawResults[
						key
					]
						.map((value) => `\`${value}\``)
						.join(", ")}.`,
				});
				continue;
			} else if (!isSupposedToBeAnArray) {
				results[key] = rawResults[key][0];
			} else {
				results[key] = rawResults[key];
			}
		}

		return options.parse(results);
	});
};
