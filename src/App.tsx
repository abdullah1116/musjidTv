import moment from 'moment';
// @ts-ignore
import iMoment from 'moment-hijri';
import { createSignal } from 'solid-js';
import './App.scss';
import { announcement } from './testData';
// announcement.announcements = [];

function App() {
  const [data, setData] = createSignal<AnnouncementData>(
    announcement as AnnouncementData
  );

  const [viewMode, setViewMode] = createSignal<'single-page' | 'slides'>(
    'single-page'
  );

  const [, setPosition] = createSignal(0);

  const [prayerUpComing, setPrayerUpComing] = createSignal(!false);

  const [time, setTime] = createSignal({
    hour: '',
    minute: '',
    second: '',
    meridiem: '',
  });

  const [date, setDate] = createSignal('');
  const [slideNumber, setSlideNumber] = createSignal(0);
  const [islamicDate, setIslamicDate] = createSignal<{
    month: string;
    date: string;
    year: string;
  }>();
  const [todayTable, setTodayTable] = createSignal<number[]>([]);

  setTodayTable(
    data().currentTime.map((time) => {
      let seconds = 0;

      seconds += +time.timehour * 60 * 60;
      seconds += +time.timeminute * 60;
      seconds += time.timeampm.toUpperCase() === 'PM' ? 12 * 60 * 60 : 0;

      return seconds;
    })
  );
  console.log(todayTable());

  // setInterval(() => {
  //   const date = new Date();
  //   const formattedTime = date.toLocaleTimeString();
  //   setTime(formattedTime);
  //   setDate(moment().format('MMM DD'));

  //   const m = iMoment();
  //   setIslamicDate({
  //     month: m._locale._iMonths[m.iMonth()],
  //     date: m.iDate(),
  //     year: m.iYear(),
  //   });
  // }, 1000);

  function announcements(withBlank = false) {
    const announcements = Array.from(data()?.announcements ?? []);

    if (viewMode() === 'slides' || withBlank) {
      announcements.push(null as any);
    }
    return announcements;
  }
  //
  // Auto Slider

  const [, setAutoSliderInterval] = createSignal<undefined | number>(undefined);

  function SliderStart() {
    SliderStop();
    setAutoSliderInterval(
      setInterval(() => {
        setSlideNumber((n) => (n + 1) % announcements().length || 0);
      }, 3 * 60 * 1000)
    );
  }

  function SliderStop() {
    setAutoSliderInterval((intervalId) => {
      if (intervalId) {
        clearInterval(intervalId);
      }

      return undefined;
    });
  }

  //
  // Time Updater

  const [, setTimeUpdaterInterval] = createSignal<undefined | number>(
    undefined
  );

  function timeUpdaterStart() {
    timeUpdaterStop();

    setTimeUpdaterInterval(
      setInterval(() => {
        const now = moment();
        setTime({
          hour: now.format('h'),
          minute: now.format('mm'),
          second: now.format('ss'),
          meridiem: now.format('A'),
        });

        setDate(now.format('MMM DD'));
        ((window as any)['moment'] = moment)();
        (window as any)['iMoment'] = iMoment;

        const m = iMoment();
        setIslamicDate({
          month: m._locale._iMonths[m.iMonth()],
          date: m.iDate(),
          year: m.iYear(),
        });
      }, 1000)
    );
  }

  function timeUpdaterStop() {
    setTimeUpdaterInterval((intervalId) => {
      if (intervalId) {
        clearInterval(intervalId);
      }

      return undefined;
    });
  }

  function getTimeOnly() {
    const sod = new Date();
    sod.setHours(0);
    sod.setMinutes(0);
    sod.setSeconds(0);
    sod.setMilliseconds(0);

    return new Date().getTime() - sod.getTime();
  }

  //
  // View Mode Setter

  function setViewModeSinglePage() {
    timeUpdaterStart();
    SliderStart();
    setViewMode('single-page');
    setSlideNumber((s) => s % announcements().length);
  }

  function setViewModeSlides() {
    SliderStop();
    timeUpdaterStop();
    setViewMode('slides');
  }

  (window as any).setPrayerUpComing = setPrayerUpComing;
  (window as any).setViewModeSlides = setViewModeSlides;
  //
  // Init

  document.addEventListener('keydown', (event) => {
    const positions: (() => void)[] = [];

    positions.push(() => {
      setViewModeSinglePage();
    });

    announcements(true).forEach((_, i) => {
      positions.push(() => {
        setViewModeSlides();
        setSlideNumber(i);
      });
    });

    setPosition((p) => {
      if (event.key === 'ArrowRight') {
        p = ++p % positions.length;
      } else if (event.key === 'ArrowLeft') {
        p = (--p + positions.length) % positions.length;
      }

      positions[p]();

      return p;
    });
  });

  fetch('https://staging2.masjidnoormesa.com/api/announcements.php')
    .then((res) => res.json())
    .then((res: ReturnType<typeof data>) => {
      setData(res);

      setTodayTable(
        data().currentTime.map((time) => {
          let seconds = 0;

          seconds += +time.timehour * 60 * 60;
          seconds += +time.timeminute * 60;
          seconds += time.timeampm.toUpperCase() === 'PM' ? 12 * 60 * 60 : 0;

          return seconds;
        })
      );

      console.log(todayTable);
    });

  setViewModeSinglePage();

  setTodayTable(
    data().currentTime.map((time) => {
      let seconds = 0;

      seconds += +time.timehour * 60 * 60;
      seconds += +time.timeminute * 60;
      seconds += time.timeampm.toUpperCase() === 'PM' ? 12 * 60 * 60 : 0;

      return seconds;
    })
  );

  return (
    <>
      <div class='background'></div>
      <div
        class={[
          'layout',
          viewMode() === 'slides' && 'layout-slides',
          prayerUpComing() && 'prayer-up-coming',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div class='time-wrap wrap'>
          <div class='box'>
            <h1 class='time'>
              {time().hour}
              <span class='time-dots'>:</span>
              {time().minute}
              <span class='time-dots'>:</span>
              <span class='time-sec'>{time().second}</span>
              {' ' + time().meridiem}
            </h1>
            <h2 class='date'>{date()}</h2>
            {islamicDate() && (
              <h2 class='date-islamic'>
                <div class='date-islamic-month'>{islamicDate()?.month}</div>
                <div class='date-islamic-date'>{islamicDate()?.date},</div>
                <div class='date-islamic-year'>{islamicDate()?.year}</div>
              </h2>
            )}
          </div>
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

        {announcements().length && (
          <div class='slide-info-wrap wrap warp-light'>
            <div class='box'>
              <div class='box-heading'>
                <div>{announcements()[slideNumber()]?.btn_label}</div>
                <div class='buttons'>
                  {announcements().map((_, i) => (
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
