import React, { useState, useRef, useEffect } from 'react';
import { format, parseISO, differenceInDays, differenceInSeconds, startOfDay, addDays, min, max, isAfter } from 'date-fns';


const initialDate = new Date(2024, 8, 27, 7, 40); // Month is 0-indexed
const deliveryOptions = [
  {
    "arrival_date": "2024-09-29",
    "cutoff": "2024-09-26T18:30:00Z"
  },
  {
    "arrival_date": "2024-09-29",
    "cutoff": "2024-09-27T09:15:00Z"
  },
  {
    "arrival_date": "2024-09-29",
    "cutoff": "2024-09-27T14:45:00Z"
  },
  {
    "arrival_date": "2024-09-30",
    "cutoff": "2024-09-26T22:00:00Z"
  },
  {
    "arrival_date": "2024-09-30",
    "cutoff": "2024-09-27T11:30:00Z"
  },
  {
    "arrival_date": "2024-09-30",
    "cutoff": "2024-09-28T08:00:00Z"
  },
  {
    "arrival_date": "2024-09-30",
    "cutoff": "2024-09-28T16:45:00Z"
  },
  {
    "arrival_date": "2024-10-01",
    "cutoff": "2024-09-27T20:15:00Z"
  },
  {
    "arrival_date": "2024-10-01",
    "cutoff": "2024-09-28T13:30:00Z"
  },
  {
    "arrival_date": "2024-10-01",
    "cutoff": "2024-09-29T10:00:00Z"
  },
  {
    "arrival_date": "2024-10-02",
    "cutoff": "2024-09-28T19:45:00Z"
  },
  {
    "arrival_date": "2024-10-02",
    "cutoff": "2024-09-29T12:30:00Z"
  },
  {
    "arrival_date": "2024-10-02",
    "cutoff": "2024-09-30T08:15:00Z"
  },
  {
    "arrival_date": "2024-10-03",
    "cutoff": "2024-09-30T15:00:00Z"
  },
  {
    "arrival_date": "2024-10-03",
    "cutoff": "2024-10-01T09:30:00Z"
  },
  {
    "arrival_date": "2024-10-03",
    "cutoff": "2024-10-01T17:45:00Z"
  },
  {
    "arrival_date": "2024-10-04",
    "cutoff": "2024-10-01T21:00:00Z"
  },
  {
    "arrival_date": "2024-10-04",
    "cutoff": "2024-10-02T11:15:00Z"
  },
  {
    "arrival_date": "2024-10-04",
    "cutoff": "2024-10-02T16:30:00Z"
  },
  {
    "arrival_date": "2024-10-05",
    "cutoff": "2024-10-01T23:45:00Z"
  },
  {
    "arrival_date": "2024-10-05",
    "cutoff": "2024-10-02T14:00:00Z"
  },
  {
    "arrival_date": "2024-10-05",
    "cutoff": "2024-10-03T08:45:00Z"
  },
  {
    "arrival_date": "2024-10-05",
    "cutoff": "2024-10-03T18:30:00Z"
  }
].sort((a, b) => a.cutoff.localeCompare(b.cutoff));

const DeliveryOptionsTimeline = () => {
  const [hoveredOption, setHoveredOption] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  // Find the earliest cutoff date and latest arrival date
  const startDate = startOfDay(min(deliveryOptions.map(option => parseISO(option.cutoff))));
  const endDate = startOfDay(addDays(max(deliveryOptions.map(option => parseISO(option.arrival_date))), 1));

  // Calculate initial slider value to initial date.
  const totalSeconds = differenceInSeconds(endDate, startDate);
  const initialSeconds = differenceInSeconds(initialDate, startDate);
  const initialSliderValue = (initialSeconds / totalSeconds) * 100;

  const [sliderValue, setSliderValue] = useState(initialSliderValue);

  const daysInRange = differenceInDays(endDate, startDate);
  const dayWidth = 100;
  const svgWidth = daysInRange * dayWidth;
  const svgHeight = 400;
  const timelineY = 50;
  const optionLineStartY = 80;

  const getXPosition = (date) => {
    const secondsFromStart = differenceInSeconds(date, startDate);
    return (secondsFromStart / totalSeconds) * svgWidth;
  };

  const getCurrentDate = () => {
    const currentSeconds = (sliderValue / 100) * totalSeconds;
    return new Date(startDate.getTime() + currentSeconds * 1000);
  };

  const currentDate = getCurrentDate();

  const colorMap = generateColorMap(deliveryOptions);

  const handleMouseMove = (event) => {
    if (svgRef.current) {
      const svgRect = svgRef.current.getBoundingClientRect();
      setMousePos({
        x: event.clientX - svgRect.left,
        y: event.clientY - svgRect.top
      });
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const isDatePastAllCutoffs = (date) => {
    const arrivalDate = startOfDay(date);
    const relevantOptions = deliveryOptions.filter(option =>
      startOfDay(parseISO(option.arrival_date)).getTime() === arrivalDate.getTime()
    );
    return relevantOptions.every(option => isAfter(currentDate, parseISO(option.cutoff)));
  };

  const renderTimeline = () => {
    return Array.from({ length: daysInRange }).map((_, index) => {
      const date = addDays(startDate, index);
      const x = index * dayWidth;
      const isPastAllCutoffs = isDatePastAllCutoffs(date);
      return (
        <g key={index} opacity={isPastAllCutoffs ? 0.3 : 1}>
          <line x1={x} y1={timelineY} x2={x} y2={svgHeight} stroke="#ccc" />
          <text x={x + 5} y={timelineY - 5} className="dayLabel">{format(date, 'EEE')}</text>
          <text x={x + 5} y={timelineY - 20} className="dayLabel">{format(date, 'MMM d')}</text>
        </g>
      );
    });
  };

  const renderDeliveryOptions = () => {
    return deliveryOptions.map((option, index) => {
      const cutoffDate = parseISO(option.cutoff);
      const arrivalDate = parseISO(option.arrival_date);

      const startX = getXPosition(cutoffDate);
      const endX = getXPosition(arrivalDate);
      const y = optionLineStartY + index * 15;
      const color = colorMap[option.arrival_date];

      const isPast = isAfter(currentDate, cutoffDate);

      return (
        <g key={index}>
          <line
            x1={startX}
            y1={y}
            x2={endX}
            y2={y}
            className="deliveryOption"
            stroke={color}
            opacity={isPast ? 0.3 : 1}
          />
          <circle
            cx={startX}
            cy={y}
            r={4}
            fill={color}
            opacity={isPast ? 0.3 : 1}
            onMouseEnter={() => setHoveredOption(option)}
            onMouseLeave={() => setHoveredOption(null)}
          />
        </g>
      );
    });
  };

  const handleSliderChange = (e) => {
    setSliderValue(parseFloat(e.target.value));
  };

  const currentDateX = getXPosition(currentDate);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width="100%"
        height="auto"
      >
        <style>
          {`
            text { font-family: Arial, sans-serif; font-size: 12px; }
            .dayLabel { font-weight: bold; }
            .deliveryOption { stroke-width: 2; }
          `}
        </style>
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <line x1={0} y1={timelineY} x2={svgWidth} y2={timelineY} stroke="black" />
        {renderTimeline()}
        {renderDeliveryOptions()}
        <line
          x1={currentDateX}
          y1={0}
          x2={currentDateX}
          y2={svgHeight}
          stroke="red"
          strokeWidth="2"
        />
      </svg>
      <input
        type="range"
        min="0"
        max="100"
        step="0.1"
        value={sliderValue}
        onChange={handleSliderChange}
        className="w-full"
      />
      <div className="text-center">
        Current Date: {format(currentDate, 'EEE MMM d, HH:mm')}
      </div>
      {hoveredOption && (
        <div
          className="absolute bg-white p-2 border border-gray-300 rounded shadow"
          style={{
            left: `${mousePos.x + 10}px`,
            top: `${mousePos.y + 10}px`,
          }}
        >
          <p>Cutoff: {format(parseISO(hoveredOption.cutoff), 'EEE MMM d, HH:mm')}</p>
          <p>Arrival: {format(parseISO(hoveredOption.arrival_date), 'EEE MMM d')}</p>
        </div>
      )}
    </div>
  );
};

function generateColorMap(options) {
  const uniqueArrivalDates = [...new Set(options.map(o => o.arrival_date))];
  const colors = ['blue', 'green', 'red', 'purple', 'orange', 'brown', 'teal'];
  return Object.fromEntries(uniqueArrivalDates.map((date, i) => [date, colors[i % colors.length]]));
}

export default DeliveryOptionsTimeline;
