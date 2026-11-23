import EventCalendar from '@/components/EventCalendar';
import type { CalendarActivity } from '@/components/EventCalendar/CalendarType';
import Loading from '@/components/Loading';
import { BACKEND_URL } from '@/services/note';
import axios from 'axios';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useQuery } from 'react-query';

function Umamusume() {
  const [eventData, setEventData] = useState<CalendarActivity[]>();
  const { isFetching } = useQuery({
    queryKey: ['umamusume'],
    queryFn: () => axios(`${BACKEND_URL}/umamusume`),
    onSuccess(data: any) {
      setEventData(
        data?.data?.data?.filter((item: CalendarActivity) =>
          Boolean(item.start_time)
        )
      );
    }
  });

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

export default Umamusume;
