import { postCategories } from "../../types/posts";

export const categories = ["All", ...postCategories] as const;
export type Filter = (typeof categories)[number];

type CategoryFilterProps = Readonly<{
    value: Filter;
    onChange: (next: Filter) => void;
}>;

export default function CategoryFilter({ value, onChange }: CategoryFilterProps) {
    return (
        <div
            role="group"
            aria-label="Filter posts by category"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:px-0"
        >
            {categories.map((category) => {
                const active = value === category;
                return (
                    <button
                        key={category}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange(category)}
                        className={`shrink-0 rounded-full px-4 py-2 text-[0.8125rem] font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep ${active
                                ? "bg-brand text-white"
                                : "bg-[#f1f3fa] text-navy/80 hover:text-navy"
                            }`}
                    >
                        {category}
                    </button>
                );
            })}
        </div>
    );
}