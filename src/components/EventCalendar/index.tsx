import { Image, Typography } from "antd";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { useMemo, useState } from "react";
import type { CalendarProps } from "./CalendarType";
import "./index.css";
import {
  calculateEventPosition,
  eventOverviewListSorting,
  generateCalendarGrid,
  levelAssignment,
  rainbowColors,
} from "./utils";
dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);

const { Link } = Typography;
function EventCalendar({ value, activity, style }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(value);
  const [showActivityOverview, setShowActivityOverview] = useState(true);

  const [collapseIdx, setCollapseIdx] = useState(-1);

  const handleMonChange = (type: boolean) => {
    setCurrentDate(
      type ? currentDate.add(1, "month") : currentDate.subtract(1, "month")
    );
  };

  const scheduleArea = useMemo(() => {
    const eventGridPosition = calculateEventPosition(currentDate, activity);
    return (
      <div className="flex-1 text-xs border-x border-b flex flex-col overflow-auto">
        {generateCalendarGrid(currentDate).map((_, i) => {
          return (
            <div
              className={`relative overflow-y-auto invisibleScrollbar bg-gray-200 ${
                collapseIdx === i ? "flex-3" : "flex-1"
              }`}
              key={i}
              onClick={() => setCollapseIdx(collapseIdx === i ? -1 : i)}
            >
              {/* 日历区 */}
              <div className="grid grid-cols-7 sticky top-0 z-50 bg-white">
                {_.map((__, j) => {
                  return (
                    <div
                      key={j}
                      className="w-full flex justify-center items-start even:border-x border-t"
                    >
                      {value.isSame(__, "day") ? (
                        <span className="w-full text-center bg-red-500">
                          {dayjs(__).format("D")}
                        </span>
                      ) : (
                        dayjs(__).format("D")
                      )}
                    </div>
                  );
                })}
              </div>
              {/* 日程区 */}
              <div>
                {eventGridPosition[i]?.map((obj) => {
                  const { id, title, left, width, level, color } = obj;
                  return (
                    <div
                      key={id}
                      className="absolute rounded-lg pl-2 overflow-hidden text-ellipsis whitespace-nowrap border border-cyan-50"
                      style={{
                        backgroundColor: color,
                        width: `calc((${width}00%/7))`,
                        left:
                          left !== 0 && left !== 7 ? `calc(${left}00%/7)` : "",
                        // top: `${20 * level + "%"}`, // 百分比受限于最上层元素的高度变化
                        top: `${1.35 * level}em`, // em只受限于离其最近的父元素（简单嵌套情况）
                      }}
                    >
                      {title}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [collapseIdx, currentDate]);

  const eventOverview = useMemo(() => {
    return (
      <div
        className={`myScrollbar overflow-y-auto overflow-x-hidden py-3 px-4 bg-[#F8FAFC] border 
${showActivityOverview ? "Slide" : "Slide collapsed"}`}
      >
        <div
          className="mb-1 cursor-pointer transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300"
          onClick={() => {
            setShowActivityOverview(!showActivityOverview);
          }}
        >
          <svg
            className="mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M2.5 12C2.5 11.8674 2.55268 11.7402 2.64645 11.6464C2.74021 11.5527 2.86739 11.5 3 11.5H13C13.1326 11.5 13.2598 11.5527 13.3536 11.6464C13.4473 11.7402 13.5 11.8674 13.5 12C13.5 12.1326 13.4473 12.2598 13.3536 12.3536C13.2598 12.4473 13.1326 12.5 13 12.5H3C2.86739 12.5 2.74021 12.4473 2.64645 12.3536C2.55268 12.2598 2.5 12.1326 2.5 12ZM2.5 8C2.5 7.86739 2.55268 7.74021 2.64645 7.64645C2.74021 7.55268 2.86739 7.5 3 7.5H13C13.1326 7.5 13.2598 7.55268 13.3536 7.64645C13.4473 7.74021 13.5 7.86739 13.5 8C13.5 8.13261 13.4473 8.25979 13.3536 8.35355C13.2598 8.44732 13.1326 8.5 13 8.5H3C2.86739 8.5 2.74021 8.44732 2.64645 8.35355C2.55268 8.25979 2.5 8.13261 2.5 8ZM2.5 4C2.5 3.86739 2.55268 3.74021 2.64645 3.64645C2.74021 3.55268 2.86739 3.5 3 3.5H13C13.1326 3.5 13.2598 3.55268 13.3536 3.64645C13.4473 3.74021 13.5 3.86739 13.5 4C13.5 4.13261 13.4473 4.25979 13.3536 4.35355C13.2598 4.44732 13.1326 4.5 13 4.5H3C2.86739 4.5 2.74021 4.44732 2.64645 4.35355C2.55268 4.25979 2.5 4.13261 2.5 4Z"
              fill="#1F2937"
            />
          </svg>
        </div>
        <div className="flex flex-col divide-y-2 divide-black divide-dashed">
          {eventOverviewListSorting(levelAssignment(activity)).map(
            (item, i) => {
              return (
                <div
                  key={item.id}
                  // tailwindcss 自定义transition写法
                  className={`w-full p-2 flex flex-col items-center justify-center gap-2 ${
                    showActivityOverview
                      ? "transition-all duration-[300ms] ease-in scale-100 break-words"
                      : "transition-all duration-[300ms] ease-in scale-0 opacity-0 overflow-hidden"
                  }`}
                  // className={`w-full px-4 rounded-lg ${
                  //   showActivityOverview ? "activityList" : "activityList collapsed"
                  // }`}
                >
                  {item?.banner && (
                    <div className="mx-auto rounded-md">
                      <Image
                        src={item?.banner}
                        alt={item?.title}
                        className={`object-contain max-sm:object-scale-down ${
                          showActivityOverview
                            ? "transition-all duration-300 ease-in opacity-100 break-words"
                            : "transition-all duration-300 ease-in opacity-0 overflow-hidden"
                        }`}
                        referrerPolicy="same-origin"
                      />
                    </div>
                  )}
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="text-gray-700 max-sm:text-xs"
                      style={{
                        textDecoration: item.isEnd ? "line-through" : "none",
                      }}
                    >
                      <span
                        className="inline-block mx-[0.2rem] rounded-full"
                        style={{
                          backgroundColor:
                            rainbowColors[i % rainbowColors.length],
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="8"
                          height="8"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <g clipPath="url(#clip0_3660_20704)">
                            <path
                              d="M8 15C6.14348 15 4.36301 14.2625 3.05025 12.9497C1.7375 11.637 1 9.85652 1 8C1 6.14348 1.7375 4.36301 3.05025 3.05025C4.36301 1.7375 6.14348 1 8 1C9.85652 1 11.637 1.7375 12.9497 3.05025C14.2625 4.36301 15 6.14348 15 8C15 9.85652 14.2625 11.637 12.9497 12.9497C11.637 14.2625 9.85652 15 8 15ZM8 16C10.1217 16 12.1566 15.1571 13.6569 13.6569C15.1571 12.1566 16 10.1217 16 8C16 5.87827 15.1571 3.84344 13.6569 2.34315C12.1566 0.842855 10.1217 0 8 0C5.87827 0 3.84344 0.842855 2.34315 2.34315C0.842855 3.84344 0 5.87827 0 8C0 10.1217 0.842855 12.1566 2.34315 13.6569C3.84344 15.1571 5.87827 16 8 16Z"
                              fill="#1F2937"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_3660_20704">
                              <rect width="16" height="16" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                      </span>
                      {item.title}
                      <span>{item.isEnd && "（已结束）"}</span>
                    </div>
                    <div className="text-xs max-sm:text-[10px] font-mono text-gray-500">
                      {item.range ??
                        `${dayjs(item.start_time).format(
                          "YYYY/MM/DD HH:mm"
                        )} ~ ${dayjs(item.end_time).format(
                          "YYYY/MM/DD HH:mm"
                        )}`}
                    </div>
                    {item.linkUrl && (
                      <Link
                        className="block text-sm"
                        href={item.linkUrl}
                        target="_blank"
                      >
                        活动详情
                      </Link>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    );
  }, [showActivityOverview]);

  return (
    <>
      <div
        className="flex border rounded-lg max-h-[30rem] min-h-[450px]"
        style={{ ...style }}
      >
        {/* 活动概览列表 */}
        {eventOverview}

        {/* 日历日程显示 */}
        <div className="flex-1 p-5 border flex flex-col">
          <nav className="flex justify-between items-center">
            <div
              className="cursor-pointer"
              onClick={() => {
                handleMonChange(false);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M11.354 1.64599C11.4006 1.69244 11.4375 1.74761 11.4628 1.80836C11.488 1.86911 11.5009 1.93423 11.5009 1.99999C11.5009 2.06576 11.488 2.13088 11.4628 2.19163C11.4375 2.25237 11.4006 2.30755 11.354 2.35399L5.70704 7.99999L11.354 13.646C11.4479 13.7399 11.5007 13.8672 11.5007 14C11.5007 14.1328 11.4479 14.2601 11.354 14.354C11.2602 14.4479 11.1328 14.5006 11 14.5006C10.8673 14.5006 10.7399 14.4479 10.646 14.354L4.64604 8.35399C4.59948 8.30755 4.56253 8.25237 4.53733 8.19163C4.51212 8.13088 4.49915 8.06576 4.49915 7.99999C4.49915 7.93423 4.51212 7.86911 4.53733 7.80836C4.56253 7.74761 4.59948 7.69244 4.64604 7.64599L10.646 1.64599C10.6925 1.59943 10.7477 1.56249 10.8084 1.53728C10.8692 1.51207 10.9343 1.4991 11 1.4991C11.0658 1.4991 11.1309 1.51207 11.1917 1.53728C11.2524 1.56249 11.3076 1.59943 11.354 1.64599Z"
                  fill="#1F2937"
                />
              </svg>
            </div>
            <div>{currentDate.format("YYYY[年] M[月]")}</div>
            <div
              className="cursor-pointer"
              onClick={() => {
                handleMonChange(true);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M4.64592 1.64599C4.69236 1.59943 4.74754 1.56249 4.80828 1.53728C4.86903 1.51207 4.93415 1.4991 4.99992 1.4991C5.06568 1.4991 5.13081 1.51207 5.19155 1.53728C5.2523 1.56249 5.30747 1.59943 5.35392 1.64599L11.3539 7.64599C11.4005 7.69244 11.4374 7.74761 11.4626 7.80836C11.4878 7.86911 11.5008 7.93423 11.5008 7.99999C11.5008 8.06576 11.4878 8.13088 11.4626 8.19163C11.4374 8.25237 11.4005 8.30755 11.3539 8.35399L5.35392 14.354C5.26003 14.4479 5.13269 14.5006 4.99992 14.5006C4.86714 14.5006 4.7398 14.4479 4.64592 14.354C4.55203 14.2601 4.49929 14.1328 4.49929 14C4.49929 13.8672 4.55203 13.7399 4.64592 13.646L10.2929 7.99999L4.64592 2.35399C4.59935 2.30755 4.56241 2.25237 4.5372 2.19163C4.512 2.13088 4.49902 2.06576 4.49902 1.99999C4.49902 1.93423 4.512 1.86911 4.5372 1.80836C4.56241 1.74761 4.59935 1.69244 4.64592 1.64599Z"
                  fill="#1F2937"
                />
              </svg>
            </div>
          </nav>
          <div className="flex py-3 text-xs">
            <div className="flex-1 text-center">周日</div>
            <div className="flex-1 text-center">周一</div>
            <div className="flex-1 text-center">周二</div>
            <div className="flex-1 text-center">周三</div>
            <div className="flex-1 text-center">周四</div>
            <div className="flex-1 text-center">周五</div>
            <div className="flex-1 text-center">周六</div>
          </div>
          {/* 父元素包裹一个子元素，两者分别采用relative和absolute，
                  正常情况下子元素可以移动到父元素之外的任何位置，
                  但父元素设置了overflow:auto的情况下，
                  这种规则下跑出父元素宽高范围的子元素会撑开父元素来实现滚动（父元素还是原本的宽高，只多了滚动条）。
                  这样就能在每个日期下面的有限范围里展示我们的日程，
                  显示不完的也可以滚动下拉 */}
          {scheduleArea}
        </div>
      </div>
    </>
  );
}

export default EventCalendar;
