import EventCalendar from '@/components/EventCalendar';
import type { CalendarActivity } from '@/components/EventCalendar/CalendarType';
import Loading from '@/components/Loading';
import RequestError from '@/components/RequestError';
import { BACKEND_URL } from '@/services/note';
import axios from 'axios';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useQuery } from 'react-query';

function FGO() {
  const [eventData, setEventData] = useState<CalendarActivity[]>();
  const { isFetching, isError, refetch } = useQuery({
    queryKey: ['fgo'],
    queryFn: () => axios(`${BACKEND_URL}/fgo`, { timeout: 12000 }),
    retry: false,
    onSuccess(data: any) {
      setEventData(
        data?.data?.data
          ?.filter((item: CalendarActivity) => {
            return Boolean(item.start_time);
          })
          .map((item: CalendarActivity) => {
            // // 带中文的日期格式dayjs都不能直接识别
            // item.start_time = dayjs(
            //   item.start_time,
            //   "YYYY M D",
            //   "zh-cn"
            // ).format("YYYY-MM-DD");
            // item.end_time = dayjs(item.end_time, "YYYY M D", "zh-cn").format(
            //   "YYYY-MM-DD"
            // );
            item.range = item.content ?? undefined;
            return item;
          })
      );
    }
  });
  // 检验日历组件
  // console.log("eventData", eventData);
  return (
    <>
      {isError ? (
        <RequestError onRetry={() => void refetch()} />
      ) : isFetching ? (
        <Loading />
      ) : (
        <EventCalendar
          {...{
            value: dayjs(),
            activity: eventData ?? []
          }}
        />
      )}
    </>
  );
}

export default FGO;
