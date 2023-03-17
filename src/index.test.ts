import { describe, it } from "vitest";
import { z, ZodError } from "zod";
import { argumentParser } from ".";

describe("argumentParser", () => {
	it("errors for mis-matched options", ({ expect }) => {
		expect(() =>
			argumentParser({
				options: z
					.object({
						foo: z.string().optional(),
					})
					.strict(),
			}).parse(["--boo"])
		).toThrow(ZodError);
	});

	it("errors for missing non-optional options", ({ expect }) => {
		expect(() =>
			argumentParser({
				options: z
					.object({
						foo: z.string(),
					})
					.strict(),
			}).parse([])
		).toThrow(ZodError);
		expect(() =>
			argumentParser({
				options: z
					.object({
						foo: z.string(),
					})
					.partial()
					.required({ foo: true })
					.strict(),
			}).parse([])
		).toThrow(ZodError);
	});

	describe("strings", () => {
		it("parses strings", ({ expect }) => {
			expect(
				argumentParser({
					options: z
						.object({
							foo: z.string().optional(),
						})
						.strict(),
				}).parse([])
			).toEqual({});
			expect(
				argumentParser({
					options: z
						.object({
							foo: z.string().optional(),
						})
						.strict(),
				}).parse(["--foo=bar"])
			).toEqual({ foo: "bar" });
			expect(
				argumentParser({
					options: z
						.object({
							foo: z.string().optional(),
						})
						.strict(),
				}).parse(["--foo=2"])
			).toEqual({ foo: "2" });
			expect(
				argumentParser({
					options: z
						.object({
							foo: z.string().optional(),
						})
						.strict(),
				}).parse(["--foo=true"])
			).toEqual({ foo: "true" });
			expect(
				argumentParser({
					options: z
						.object({
							foo: z.string().optional(),
						})
						.strict(),
				}).parse(["--foo="])
			).toEqual({ foo: "" });
		});

		it("errors for null strings", ({ expect }) => {
			expect(() =>
				argumentParser({
					options: z
						.object({
							foo: z.string().optional(),
						})
						.strict(),
				}).parse(["--foo"])
			).toThrow(ZodError);
		});
	});

	describe("aliases", () => {
		it("parses aliases", ({ expect }) => {
			expect(
				argumentParser({
					options: z
						.object({
							foo: z.string().optional(),
						})
						.strict(),
					aliases: {
						f: "foo",
					},
				}).parse(["-f=bar"])
			).toEqual({ foo: "bar" });
		});

		it("errors for null aliases", ({ expect }) => {
			expect(() =>
				argumentParser({
					options: z
						.object({
							foo: z.string().optional(),
						})
						.strict(),
					aliases: {
						f: "foo",
					},
				}).parse(["-f"])
			).toThrow(ZodError);
		});

		it("errors for mis-matched aliases", ({ expect }) => {
			expect(() =>
				argumentParser({
					options: z
						.object({
							foo: z.string().optional(),
						})
						.strict(),
					aliases: {
						// @ts-expect-error
						f: "boo",
					},
				}).parse(["-f"])
			).toThrow(ZodError);
		});
	});

	describe("numbers", () => {
		it("parses numbers", ({ expect }) => {
			expect(
				argumentParser({
					options: z
						.object({
							foo: z.coerce.number().optional(),
						})
						.strict(),
				}).parse([])
			).toEqual({});
			expect(
				argumentParser({
					options: z
						.object({
							foo: z.coerce.number().optional(),
						})
						.strict(),
				}).parse(["--foo=2"])
			).toEqual({ foo: 2 });
			expect(
				argumentParser({
					options: z
						.object({
							foo: z.coerce.number().optional(),
						})
						.strict(),
				}).parse(["--foo=2.2"])
			).toEqual({ foo: 2.2 });
			expect(
				argumentParser({
					options: z
						.object({
							foo: z.coerce.number().optional(),
						})
						.strict(),
				}).parse(["--foo=0"])
			).toEqual({ foo: 0 });
			expect(
				argumentParser({
					options: z
						.object({
							foo: z.coerce.number().optional(),
						})
						.strict(),
				}).parse(["--foo=-1"])
			).toEqual({ foo: -1 });
			expect(
				argumentParser({
					options: z
						.object({
							foo: z.coerce.number().optional(),
						})
						.strict(),
				}).parse(["--foo=+1"])
			).toEqual({ foo: 1 });
			expect(
				argumentParser({
					options: z
						.object({
							foo: z.coerce.number().optional(),
						})
						.strict(),
				}).parse(["--foo="])
			).toEqual({ foo: 0 });
		});

		it('errors for "NaN" numbers', ({ expect }) => {
			expect(() =>
				argumentParser({
					options: z
						.object({
							foo: z.coerce.number().optional(),
						})
						.strict(),
				}).parse(["--foo=bar"])
			).toThrow(ZodError);
		});
	});

	describe("literals", () => {
		it("parses literals", ({ expect }) => {
			expect(
				argumentParser({
					options: z
						.object({
							foo: z.literal("bar").optional(),
						})
						.strict(),
				}).parse(["--foo=bar"])
			);
		});

		it("errors for invalid literals", ({ expect }) => {
			expect(() =>
				argumentParser({
					options: z
						.object({
							foo: z.literal("bar").optional(),
						})
						.strict(),
				}).parse(["--foo=boo"])
			).toThrow(ZodError);
		});
	});

	describe("booleans", () => {
		it("parses booleans", ({ expect }) => {
			expect(
				argumentParser({
					options: z
						.object({
							foo: z
								.union([
									z.literal("true").transform(() => true),
									z.literal("false").transform(() => false),
									z.null().transform(() => true),
								])
								.default("false"),
						})
						.strict(),
				}).parse(["--foo=true"])
			).toEqual({ foo: true });
			expect(
				argumentParser({
					options: z
						.object({
							foo: z
								.union([
									z.literal("true").transform(() => true),
									z.literal("false").transform(() => false),
									z.null().transform(() => true),
								])
								.default("false"),
						})
						.strict(),
				}).parse(["--foo=false"])
			).toEqual({ foo: false });
			expect(
				argumentParser({
					options: z
						.object({
							foo: z
								.union([
									z.literal("true").transform(() => true),
									z.literal("false").transform(() => false),
									z.null().transform(() => true),
								])
								.default("false"),
						})
						.strict(),
				}).parse(["--foo"])
			).toEqual({ foo: true });
			expect(
				argumentParser({
					options: z
						.object({
							foo: z
								.union([
									z.literal("true").transform(() => true),
									z.literal("false").transform(() => false),
									z.null().transform(() => true),
								])
								.default("false"),
						})
						.strict(),
				}).parse([])
			).toEqual({ foo: false });
		});
	});

	describe("arrays", () => {
		it("parses arrays", ({ expect }) => {
			expect(
				argumentParser({
					options: z
						.object({
							foo: z.array(z.string()).optional(),
						})
						.strict(),
				}).parse(["--foo=bar"])
			).toEqual({ foo: ["bar"] });
			expect(
				argumentParser({
					options: z
						.object({
							foo: z.array(z.string()).optional(),
						})
						.strict(),
				}).parse(["--foo=bar", "--foo=boo"])
			).toEqual({ foo: ["bar", "boo"] });
		});

		it("errors when multiple values are given for non-array types", ({
			expect,
		}) => {
			expect(() =>
				argumentParser({
					options: z
						.object({
							foo: z.string().optional(),
						})
						.strict(),
				}).parse(["--foo=bar", "--foo=boo"])
			).toThrow(ZodError);
		});
	});

	describe.skip.todo("objects", () => {
		it("parses objects", ({ expect }) => {
			expect(
				argumentParser({
					options: z
						.object({
							foo: z.object({
								bar: z.string(),
							}),
						})
						.strict(),
				}).parse(["--foo.bar=boo"])
			).toEqual({ foo: { bar: "boo" } });
		});
	});
});
