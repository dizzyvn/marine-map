import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  datesWithImages: Set<string>; // Set of dates in format "YYYY-MM-DD"
  selectedDate: string | null;
  onDateSelect: (date: string | null) => void;
}

export default function Calendar({ datesWithImages, selectedDate, onDateSelect }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Handle date click
  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (selectedDate === dateStr) {
      // Deselect if clicking same date
      onDateSelect(null);
    } else {
      onDateSelect(dateStr);
    }
  };

  // Generate calendar days
  const calendarDays: (number | null)[] = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="p-4 border-b border-gray-200">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Date Filter</h3>

      {/* Month/Year Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={previousMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-sm font-medium">
          {monthNames[month]} {year}
        </div>
        <button
          onClick={nextMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-xs text-gray-500 text-center font-medium py-1">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const hasImages = datesWithImages.has(dateStr);
          const isSelected = selectedDate === dateStr;
          const isToday =
            new Date().getDate() === day &&
            new Date().getMonth() === month &&
            new Date().getFullYear() === year;

          return (
            <button
              key={day}
              onClick={() => hasImages && handleDateClick(day)}
              disabled={!hasImages}
              className={`
                aspect-square text-xs rounded transition-colors
                ${hasImages ? 'cursor-pointer' : 'cursor-default text-gray-300'}
                ${isSelected ? 'bg-primary text-white font-semibold' : ''}
                ${!isSelected && hasImages ? 'hover:bg-gray-100 text-gray-700' : ''}
                ${!isSelected && !hasImages ? 'text-gray-300' : ''}
                ${isToday && !isSelected ? 'border border-primary' : ''}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="w-5 h-5 bg-primary rounded flex items-center justify-center text-white font-semibold">1</div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="w-5 h-5 border border-primary rounded flex items-center justify-center">1</div>
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center">1</div>
          <span>Has images</span>
        </div>
      </div>

      {selectedDate && (
        <button
          onClick={() => onDateSelect(null)}
          className="w-full mt-3 text-xs text-primary hover:text-primary-hover transition-colors"
        >
          Clear date filter
        </button>
      )}
    </div>
  );
}
