import dayjs, { Dayjs } from "dayjs";
import { CalendarActivity, CalendarWeekItem } from "./CalendarType";
// import classNames from "classnames";

export const rainbowColors = [
  "#fca5a5",
  "#fdba74",
  "#fde047",
  "#86efac",
  "#5eead4",
  "#93c5fd",
  "#d8b4fe",
];

export const generateCalendarGrid = (date: Dayjs | string) => {
  const startM = dayjs(date).startOf("M");
  const endM = dayjs(date).endOf("M");
  const start = startM.subtract(parseInt(startM.format("d")), "day");
  const end = endM.add(6 - parseInt(endM.format("d")), "day");
  const length = end.diff(start, "day") + 1;
  const res: string[][] = [];
  const temp: string[] = [];
  Array.from({ length }).forEach((_, i) => {
    temp.push(start.add(i, "day").format("YYYY-MM-DD"));
  });
  for (let i = 0; i < temp.length; i += 7) {
    res.push(temp.slice(i, i + 7));
  }
  return res;
};

// 层级分配算法
// 日程的排布逻辑细节：
// - 日程越早的排的层级越高
// - 日程一旦确定层级就是连续的，直至结束还是确定好的层级位置
// - 为了保证空间充分利用，一个新日程的起始日期要加入，会看当前每个层级进行日程的结束时间，
// 从高到低一旦有个层级结束日期等于或早过新日程的起始日期，新日程就是这个层级接着排布下去
export const levelAssignment = (events: CalendarActivity[]) => {
  // 记录每一层级的当前最新的结束日期
  // 用于判断新日程是直接接在某层级日程的后面还是为新日程添加新层级
  const check: Dayjs[] = [];
  // 按日程的起始日期进行排序
  const sortActivity = events.sort((a, b) => {
    return dayjs(a.start_time).isBefore(b.start_time) ? -1 : 1;
  });
  return sortActivity.map((item) => {
    const { start_time, end_time } = item;
    if (check.length === 0) {
      check.push(dayjs(end_time));
      return { ...item, level: 1 };
    }
    // 遍历层级，是否需要另起一行
    const isNeedNewLine = check.findIndex((endDate) => {
      return dayjs(start_time).isSameOrAfter(endDate);
    });
    if (isNeedNewLine === -1) {
      // 没有超过任一层级的最新的活动结束日期，就需要新建一行
      check.push(dayjs(end_time));
      return { ...item, level: check.length };
    } else {
      // 有 就在符合的层级进行添加，标记，并更新活动的结束日期
      check[isNeedNewLine] = dayjs(end_time);
      return { ...item, level: isNeedNewLine + 1 };
    }
  });
};

export const calculateEventPosition = (
  date: Dayjs | string,
  events: CalendarActivity[]
): CalendarWeekItem[][] => {
  const res = [];
  const temp = generateCalendarGrid(date);
  const eventsWithLevel = levelAssignment(events);
  // 一个活动对应一种颜色 尽量区分开
  const colorMap = new Map<number, string>(
    events.map((item, i) => [item.id, rainbowColors[i % rainbowColors.length]])
  );

  for (let i = 0; i < temp.length; i++) {
    const week = temp[i];
    const thisWeekEvents = [];
    for (let j = 0; j < eventsWithLevel.length; j++) {
      const { start_time, end_time } = eventsWithLevel[j];
      // 控制日程在这一周的显示起始位置 left 和结束位置 width
      let left = 0;
      let width = 0;
      week.forEach((day) => {
        // 判断这周的第 n 天是否在当前日程的起始和结束时间内
        if (dayjs(day).isBetween(start_time, end_time, "day", "[]")) {
          width++;
        }
        // 不在就向左偏移一格，空出这一天
        if (width === 0) {
          left++;
        }
      });
      width > 0 &&
        thisWeekEvents.push({
          ...eventsWithLevel[j],
          left,
          width,
          color: colorMap.get(eventsWithLevel[j].id) as string,
        });
    }
    res.push(thisWeekEvents);
  }
  return res;
};

export const parseClassName = (event: CalendarWeekItem): string => {
  // !!! tailwindcss 样式不生效问题
  // https://tailwindcss.com/docs/content-configuration#dynamic-class-names
  // tailwindcss 目前不支持  拼接字符串  这种动态类名的写法
  // tailwindcss 只会在源文件中找到作为完全不间断的字符串存在的类。（如下面这种不完整的类名，他就不会进行处理）
  const { left, width, level, color } = event;
  return `absolute rounded-lg pl-2 bg-[${color}] top-[${
    20 * level + "%"
  }] width-[calc(${width}00%/7)] ${
    left === 0 || left === 7 ? "" : `left-[calc(${left}00%/7)]`
  }`;
  // return classNames("absolute rounded-lg pl-2", {
  //   [`bg-[${color}]`]: true,
  //   [`top-[${20 * level + "%"}]`]: true,
  //   [`w-[calc(${width}00%/7)]`]: true,
  //   [`left-[calc(${left}00%/7)]`]: left !== 0 && left !== 7,
  // });
};

// 已结束的活动往后排序，优先展示正在进行的活动
export const eventOverviewListSorting = (events: CalendarActivity[]) => {
  const endEventList: CalendarActivity[] = [];
  let idx = 0;
  while (idx <= events.length - 1) {
    const element = events[idx];
    if (dayjs().isAfter(element.end_time)) {
      events.splice(idx, 1);
      element && endEventList.push({ ...element, isEnd: true });
    } else {
      idx++;
    }
  }
  events.push(...endEventList);
  return events;
};
