import moment from 'moment';
// @ts-ignore
import iMoment from 'moment-hijri';
import { createSignal } from 'solid-js';
import './App.scss';
import { announcement } from './testData';
// announcement.announcements = [];

const prayerNames = {
  0: 'Fajr',
  1: 'Dhuhr',
  2: 'Asr',
  3: 'Maghrib',
  4: 'Isha',
  5: 'Jummah',
};

function App() {
  const [data, setData] = createSignal<AnnouncementData>(
    announcement as AnnouncementData
  );
  const [showPrayerAfter, setShowPrayerAfter] = createSignal(false);

  const [viewMode, setViewMode] = createSignal<'single-page' | 'slides'>(
    'single-page'
  );

  const [, setPosition] = createSignal(0);

  const [prayerUpComing, setPrayerUpComing] = createSignal({
    show: false,
    showBig: false,
    remainingTime: 0,
  });

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

  // setTodayTable(
  //   data().currentTime.map((time) => {
  //     let seconds = 0;

  //     seconds += +time.timehour * 60 * 60;
  //     seconds += +time.timeminute * 60;
  //     seconds += time.timeampm.toUpperCase() === 'PM' ? 12 * 60 * 60 : 0;

  //     return seconds;
  //   })
  // );

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

    if (!prayerUpComing().show && (viewMode() === 'slides' || withBlank)) {
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

  const [, setPrayerCheckInterval] = createSignal<undefined | number>(
    undefined
  );

  function prayerCheckStart() {
    setPrayerCheckInterval(
      setInterval(() => {
        const now = getTimeOnly() / 1000;

        let upcoming = false;

        const availablePryers =
          new Date().getDay() === 5 ? [0, 2, 3, 4, 5] : [0, 1, 2, 3, 4];

        for (const prayerId of availablePryers) {
          const prayerTimeInSeconds = todayTable()[prayerId];

          if (
            prayerTimeInSeconds - now < 15 * 60 &&
            prayerTimeInSeconds - now >= -(5 * 60)
          ) {
            // console.log(
            //   '🚀 ~ setInterval ~ prayerTimeInSeconds:',
            //   prayerTimeInSeconds,
            //   todayTable()
            // );
            upcoming = true;
            const remainingTime = Math.max(0, prayerTimeInSeconds - now + 1);
            setPrayerUpComing({
              show: upcoming,
              remainingTime: remainingTime,
              showBig: remainingTime < 60 && remainingTime > -15,
            });
            break;
          }
        }

        // if (!upcoming) {
        //   for (const prayerTimeInSeconds of todayTable()) {
        //     if (
        //       prayerTimeInSeconds - now < 3 * 60 &&
        //       prayerTimeInSeconds - now >= -(20 * 60)
        //     ) {
        //       console.log(
        //         '🚀 ~ setInterval ~ prayerTimeInSeconds - now:',
        //         prayerTimeInSeconds - now
        //       );
        //       upcoming = true;
        //       setPrayerUpComing({
        //         show: upcoming,
        //         remainingTime: prayerTimeInSeconds - now,
        //       });

        //       // // Determine whether to show upcoming or existing prayer info
        //       // if (prayerTimeInSeconds - now <= 1 * 60) {
        //       //   // If within 1 minute of prayer start, show existing prayer info
        //       //   setShowPrayerAfter(false);
        //       // } else if (prayerTimeInSeconds - now <= 20 * 60) {
        //       //   // If within 20 minutes before prayer start, show upcoming prayer info
        //       //   setShowPrayerAfter(true);
        //       // }

        //       break;
        //     }
        // }
        // }
        // // Check if we are within 1 minute *after* the prayer start time
        // if (
        //   now > prayerTimeInSeconds &&
        //   now - prayerTimeInSeconds <= 1 * 60
        // ) {
        //   setShowPrayerAfter(false); // Show existing prayer info
        //   upcoming = true; // Keep the prayerUpComing state active for timing
        // }

        if (upcoming) {
          setViewModeSinglePage();
        } else {
          setPrayerUpComing({ show: false, showBig: false, remainingTime: 0 });
        }
      }, 1000)
    );
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

  //
  // View Mode Setter

  function setViewModeSinglePage() {
    timeUpdaterStart();
    SliderStart();
    setViewMode('single-page');
    setSlideNumber((s) => s % announcements().length);
  }

  function setViewModeSlides() {
    if (prayerUpComing().show) return;

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

    if (!prayerUpComing().show) {
      positions.push(() => {
        setViewModeSinglePage();
      });
    }

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
      // setData(res);
      setData(announcement);

      setTodayTable(
        data().currentTime.map((time) => {
          let seconds = 0;

          seconds += +time.timehour * 60 * 60;
          seconds += +time.timeminute * 60;
          seconds += time.timeampm.toUpperCase() === 'PM' ? 12 * 60 * 60 : 0;

          return seconds;
        })
      );

      prayerCheckStart();
    });

  setViewModeSinglePage();

  // setTodayTable(
  //   data().currentTime.map((time) => {
  //     let seconds = 0;

  //     seconds += +time.timehour * 60 * 60;
  //     seconds += +time.timeminute * 60;
  //     seconds += time.timeampm.toUpperCase() === 'PM' ? 12 * 60 * 60 : 0;

  //     return seconds;
  //   })
  // );

  function getTimeOnly() {
    const sod = new Date();
    sod.setHours(0);
    sod.setMinutes(0);
    sod.setSeconds(0);
    sod.setMilliseconds(0);

    return new Date().getTime() - sod.getTime();
  }

  return (
    <>
      {/* <div style={{ position: 'absolute' }}>
        <pre style={'color:black'}>
          {JSON.stringify(
            {
              viewMode: viewMode(),
              showPrayerAfter: showPrayerAfter(),
              prayerUpComing: prayerUpComing(),
            },
            undefined,
            5
          )}
        </pre>
      </div> */}
      <div class='background'></div>

      <div
        class={[
          'layout',
          viewMode() === 'slides' && 'layout-slides',
          prayerUpComing().show && prayerUpComing().showBig
            ? 'up-coming-prayer-big'
            : 'up-coming-prayer',
        ]
          .filter(Boolean)
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

        <div class='up-coming-prayer-wrap wrap'>
          <div class='box'>
            <span class='box-heading'>Next Iqmah</span>
            <div class='box-content'>
              <span class='up-coming-prayer'>
                {prayerUpComing().show &&
                  (() => {
                    const remainingSeconds = prayerUpComing().remainingTime;
                    const hours = Math.floor(remainingSeconds / 3600);
                    const minutes = Math.floor((remainingSeconds % 3600) / 60);
                    const seconds = Math.floor(remainingSeconds % 60);

                    return `${
                      hours > 0 ? String(hours).padStart(2, '0') + ':' : ''
                    }${String(minutes).padStart(2, '0')}:${String(
                      seconds
                    ).padStart(2, '0')}s`;
                  })()}
              </span>
            </div>
          </div>
        </div>

        <div class='prayer-after-warp wrap'>
          <div class='box'>
            <span class='box-heading'>Prayer in Progress</span>
            <div class='box-content'>Please join the congregation.</div>
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
