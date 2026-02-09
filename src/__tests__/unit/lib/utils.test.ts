import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("merges multiple class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("handles conditional classes via falsy values", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("handles undefined and null inputs", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("resolves Tailwind CSS conflicts by keeping the last value", () => {
    // tailwind-merge resolves conflicting utilities
    expect(cn("px-4", "px-2")).toBe("px-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    expect(cn("mt-4", "mt-8")).toBe("mt-8");
  });

  it("preserves non-conflicting Tailwind classes", () => {
    expect(cn("px-4", "py-2", "mt-4")).toBe("px-4 py-2 mt-4");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
    expect(cn(undefined)).toBe("");
  });

  it("works with clsx array syntax", () => {
    expect(cn(["px-4", "py-2"])).toBe("px-4 py-2");
  });

  it("works with clsx object syntax for conditional classes", () => {
    expect(cn({ "bg-primary": true, "bg-secondary": false })).toBe(
      "bg-primary"
    );
  });

  it("handles complex real-world usage patterns", () => {
    // This mirrors how cn() is actually used in shadcn/ui components
    const isActive = true;
    const isDisabled = false;

    const result = cn(
      "rounded-md border px-4 py-2",
      isActive && "bg-primary text-primary-foreground",
      isDisabled && "opacity-50 cursor-not-allowed"
    );

    expect(result).toBe(
      "rounded-md border px-4 py-2 bg-primary text-primary-foreground"
    );
  });
});
