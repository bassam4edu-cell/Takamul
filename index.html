import React from 'react';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import arabic from 'react-date-object/calendars/arabic';
import arabic_ar from 'react-date-object/locales/arabic_ar';

interface HijriDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

const HijriDatePicker: React.FC<HijriDatePickerProps> = ({ value, onChange, className, placeholder, required }) => {
  return (
    <DatePicker
      calendar={arabic}
      locale={arabic_ar}
      value={value ? new Date(value) : null}
      onChange={(date: DateObject | null) => {
        if (date) {
          const d = date.toDate();
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          onChange(`${year}-${month}-${day}`);
        } else {
          onChange('');
        }
      }}
      containerClassName="w-full"
      inputClass={className || "bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-emerald-500/20 w-full"}
      placeholder={placeholder || "اختر التاريخ"}
      calendarPosition="bottom-right"
      required={required}
    />
  );
};

export default HijriDatePicker;
