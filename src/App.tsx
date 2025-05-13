import moment from 'moment';
// @ts-ignore
import iMoment from 'moment-hijri';
import { createSignal } from 'solid-js';
import './App.scss';

function App() {
  const [data, setData] = createSignal<AnnouncementData>(
    {} as AnnouncementData
  );
  const [time, setTime] = createSignal('');
  const [date, setDate] = createSignal('');
  const [slideNumber, setSlideNumber] = createSignal(0);
  const [islamicDate, setIslamicDate] = createSignal<{
    month: string;
    date: string;
    year: string;
  }>();

  setInterval(() => {
    const date = new Date();
    const formattedTime = date.toLocaleTimeString();
    setTime(formattedTime);
    setDate(moment().format('MMM DD'));
    ((window as any)['moment'] = moment)();
    (window as any)['iMoment'] = iMoment;

    const m = iMoment();
    setIslamicDate({
      month: m._locale._iMonths[m.iMonth()],
      date: m.iDate(),
      year: m.iYear(),
    });
  }, 1000);

  setInterval(() => {
    setSlideNumber((n) => (n + 1) % data()?.announcements?.length || 0);
  }, 3000);

  fetch('https://staging2.masjidnoormesa.com/api/announcements.php')
    .then((res) => res.json())
    .then((res) => setData(res));

  return (
    <>
      <div class='background'></div>
      <div class='layout'>
        <div class='box time-wrap wrap'>
          <h1 class='time'>{time()}</h1>
          <h2 class='date'>{date()}</h2>
          {islamicDate() && (
            <h2 class='date-islamic'>
              <div class='date-islamic-month'>{islamicDate()?.month}</div>
              <div class='date-islamic-date'>{islamicDate()?.date},</div>
              <div class='date-islamic-year'>{islamicDate()?.year}</div>
            </h2>
          )}
        </div>

        <div class='musjid-info-wrap wrap warp-light'>
          <div class='box'>
            <span class='box-heading'>Musjid Al-Noor</span>
            <div class='box-content'>
              <div>
                <div>602-816-7428</div>
                <div>imam@masjidnoormesa.com</div>
                <div>55 N Matlock, Mesa, AZ 85203</div>
              </div>
              <div class='qr-code'>
                <img src='/assets/qr-code.svg' />
              </div>
            </div>
          </div>
        </div>

        {data()?.announcements?.length && (
          <div class='slide-info-wrap wrap warp-light'>
            <div class='box'>
              <div class='box-heading'>
                <div>
                  {' '}
                  {data().announcements[slideNumber()]?.btn_label ||
                    `Slide ${slideNumber()}`}
                </div>
                <div>
                  {data().announcements.length > 1 &&
                    data().announcements.map((_, i) => (
                      <>
                        <button class='btn' onclick={() => setSlideNumber(i)}>
                          {i === slideNumber() ? 'O' : '-'}
                        </button>
                      </>
                    ))}
                </div>
              </div>
              <div
                class='box-content'
                innerHTML={
                  data().announcements[slideNumber()]?.announcement || ''
                }
              ></div>
            </div>
          </div>
        )}

        <div class='up-coming-wrap wrap'>
          <div class='box'>
            <span class='box-heading'>Next Iqmah</span>
            <div class='box-content '>
              <span class='up-coming'>5:30s</span>
            </div>
          </div>
        </div>
        <div class='timetable-wrap wrap'>
          <div class='box'>
            <span class='box-heading'>Prayer Timetable</span>
            {data()?.currentTime?.map((time) => (
              <div class='table-row'>
                <div class='name'>{time.prayername}</div>
                <div class='begins'>
                  {
                    ((data().startTime as any)[
                      String.fromCharCode(97 + time.timeid)
                    ] || {}) as any
                  }
                </div>
                <div class='starts'>
                  <div class='starts-time'>
                    {time.timehour}:{time.timeminute} {time.timeampm}
                  </div>
                  <div class='change'>6:10 after 2 days</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;

export interface CurrentTimeItem {
  timeid: number;
  dateC: string;
  prayername: string;
  timehour: number;
  timeminute: string;
  timeampm: string;
  time: string;
}

export interface StartTime {
  a: string;
  b: string;
  c: string;
  d: string;
  e: string;
  f: string;
}

export interface AnnouncementItem {
  id: number;
  announcement: string;
  btn_label: string;
  btn_url: string;
  position: number;
}

export interface RecordingItem {
  id: number;
  Speaker: string;
  Category: string;
  Topic: string;
  URL: string;
  Recording_Date: string;
}

export interface Pages {
  page: number;
  totalPages: number;
}

export interface InfoItem {
  id: string;
  data: string;
}

export interface AnnouncementData {
  currentTime: CurrentTimeItem[];
  startTime: StartTime;
  announcements: AnnouncementItem[];
  recordings: RecordingItem[];
  pages: Pages;
  info: InfoItem[];
}
