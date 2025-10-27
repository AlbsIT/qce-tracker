import './App.css'
import { useEffect, useState } from 'react'
import { FaPaperPlane, FaSearch, FaSpinner } from 'react-icons/fa';
import { useDebounce } from 'use-debounce';
import { AxiosError } from "axios";
import { api } from './lib';
import dayjs from 'dayjs';

// QCE24608DE3
type Status = {
    id: string;
    requestId: string;
    statusDisplay: string;
    statusDescription: string;
    dateUpdated: string;
};

type Address = {
  city: string;
  zipCode: string;
}

type Result = {
  statuses: Status[];
  consignee: {
    address: Address;
  };
  shipper: {
    address: Address;
  };
}

const blacklist = ["Approved", "Rider Assign", "For Approval"];

function App() {
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [rawQuery, setRawQuery] = useState<string | undefined>(undefined);
  const [query] = useDebounce(rawQuery, 500);
  const [results, setResults] = useState<Status[]>([]);

  const search = () => {
    if (!query) {
      return;
    }
    
    setError(undefined);
    setFetching(true);
    api.get<Result>(`/requests/track?query=${query}`)
      .then(({ data }) => {
        const d = data.statuses.sort((a,b) => new Date(b.dateUpdated).getTime() - new Date(a.dateUpdated).getTime()).filter((s) => !blacklist.includes(s.statusDisplay))

        if (d && d.length > 0) {
          setResults(d);
          console.log(data);
        }
      })
      .catch((e: AxiosError) => {
        const error = import.meta.env.MODE === 'production' ? 'Something went wrong! Please contact site admininstrator' : ((e.response?.data as {message: string}).message ?? e.message)
        setError(error);
      })
      .finally(() => {
        setFetching(false);
      });
  }

  useEffect(() => {
      search();
  }, [query]);

  return (
    <>
    QCE24608DE3

      <section className="w-full">
        <div className="w-full border-gray-300 border rounded-md flex flex-row items-center focus-within:border-black px-2 gap-3">
          <FaSearch className="text-gray-400 text-md ml-3"/>
          <input className="focus:outline-none py-3 w-full" value={rawQuery} onChange={(e) => setRawQuery(e.target.value)} placeholder="Enter tracking number"/>

          <button onClick={() => search()} className="text-white">
            <FaPaperPlane />
          </button>
        </div>
      </section>

      <section className="mt-4 flex flex-col">
        { error && <p className="place-self-center font-bold text-red-500 text-md">{error}</p> }
        { fetching && <FaSpinner className="text-4xl animate-spin place-self-center"/> }
        { results.length > 0 && (
          <div>
            <h1>{results[0].statusDisplay}</h1>
            <table>
              <tbody>
              {
                results.map((r, i) => (
                  <tr key={i}>
                    <td>{dayjs(r.dateUpdated).format("MM D, YYYY - hh:mm A")}</td>
                    <td>
                      <b>{r.statusDisplay}</b>
                      <p>{r.statusDescription}</p>
                    </td>
                  </tr>
                ))
              }
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
  }

export default App
