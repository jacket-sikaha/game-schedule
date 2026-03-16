import EventCalendar from '@/components/EventCalendar';
import type { CalendarActivity } from '@/components/EventCalendar/CalendarType';
import Loading from '@/components/Loading';
import { BACKEND_URL } from '@/services/note';
import axios from 'axios';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useQuery } from 'react-query';

function SnowBreak() {
  const [eventData, setEventData] = useState<CalendarActivity[]>();
  const { isFetching } = useQuery({
    queryKey: ['SnowBreak'],
    queryFn: () => axios(`${BACKEND_URL}/cbjq`),
    onSuccess(data: any) {
      setEventData(
        data?.data?.data?.filter((item: CalendarActivity) => {
          return Boolean(item.start_time);
        })
      );
    }
  });
  // 检验日历组件
  return (
    <>
      {isFetching ? (
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

export default SnowBreak;
