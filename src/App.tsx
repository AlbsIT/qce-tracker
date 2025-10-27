import './App.css'
import { useEffect, useState } from 'react'
import { FaPaperPlane, FaSearch, FaSpinner } from 'react-icons/fa';
import { useDebounce } from 'use-debounce';
import { AxiosError } from "axios";
import { api } from './lib';
import dayjs from 'dayjs';
import { FaArrowRightLong } from 'react-icons/fa6';

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
  const [request, setRequest] = useState<Result | undefined>();

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
          setRequest({...data, statuses: d});
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
      <section className="w-full">
        <div className="w-full border-gray-300 border rounded-md flex flex-row items-center focus-within:border-black px-2 gap-3">
          <FaSearch className="text-gray-400 text-md ml-3"/>
          <input className="focus:outline-none py-3 w-full" value={rawQuery} onChange={(e) => setRawQuery(e.target.value)} placeholder="Enter tracking number"/>

          <button onClick={() => search()} className="text-white">
            <FaPaperPlane />
          </button>
        </div>
      </section>

      <section className="mt-4 flex flex-col items-stretch">
        { error && <p className="place-self-center font-bold text-red-500 text-md">{error}</p> }
        { fetching && <FaSpinner className="text-4xl animate-spin place-self-center"/> }
        { request && (
          <div>
            <div className="w-full flex flex-col items-center py-5">
                <h1>{request.statuses[0].statusDisplay}</h1>
                <p className="text-xl font-normal">{request.statuses[0].statusDescription}</p>
                <p className="mt-3 text-md text-gray-500 font-normal">{dayjs(request.statuses[0].dateUpdated).format("dddd MMM D, YYYY hh:mm A Z")}</p>

                <div className="w-[80%] my-6 items-center flex flex-row justify-between">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-gray-500 text-md">From</p>
                    <p>{`${request.consignee.address.city} ${request.consignee.address.zipCode}`}</p>
                  </div>

                  <FaArrowRightLong className="text-4xl text-gray-500"/>

                  <div className="flex flex-col items-center justify-center">
                    <p className="text-gray-500 text-md">To</p>
                    <p>{`${request.shipper.address.city} ${request.shipper.address.zipCode}`}</p>
                  </div>
                </div>
            </div>
            
            <table className="w-full border-t border-gray-300">
              <tbody className="flex flex-col gap-3 w-full py-5">
              {
                request.statuses.map((r, i) => (
                  <tr key={i} className="flex gap-2 flex-row justify-between w-full items-center">
                    <td className="flex-1">
                      <b>{r.statusDisplay}</b>
                      <p>{r.statusDescription}</p>
                    </td>
                    <td className="min-w-[10vw] text-xs text-gray-600 text-right">{dayjs(r.dateUpdated).format("MMM D, YYYY hh:mm A")}</td>
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
