import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

function Calendar({
  className = "",
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={`calendar ${className}`}
      classNames={{
        months: "calendar-months",
        month: "calendar-month",
        caption: "calendar-caption",
        caption_label: "calendar-caption-label",
        nav: "calendar-nav",
        nav_button: "calendar-nav-button btn btn-ghost btn-sm",
        nav_button_previous: "calendar-nav-previous",
        nav_button_next: "calendar-nav-next",
        table: "calendar-table",
        head_row: "calendar-head-row",
        head_cell: "calendar-head-cell",
        row: "calendar-row",
        cell: "calendar-cell",
        day: "calendar-day btn btn-ghost btn-sm",
        day_range_start: "calendar-day-range-start",
        day_range_end: "calendar-day-range-end", 
        day_selected: "calendar-day-selected",
        day_today: "calendar-day-today",
        day_outside: "calendar-day-outside",
        day_disabled: "calendar-day-disabled",
        day_range_middle: "calendar-day-range-middle",
        day_hidden: "calendar-day-hidden",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className = "", ...props }) => (
          <ChevronLeft size={16} className={className} {...props} />
        ),
        IconRight: ({ className = "", ...props }) => (
          <ChevronRight size={16} className={className} {...props} />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };