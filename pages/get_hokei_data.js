import { useEffect, useState } from 'react';

function Home() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch('/api/hokei_man');
      const result = await response.json();
      setData(result);
    }
    fetchData();
  }, []);

  return (
    <div>
      <h1>Data from PostgreSQL</h1>
        <ul>
          {
              data.map((item) => (
                      <li key={item.left_player_id}>{item.id}:{item.left_player_name}</li>
              ))
          }
          {
              data.map((item) => (
                      <li key={item.right_player_id}>{item.id}:{item.right_player_name}</li>
              ))
          }
      </ul>
    </div>
  );
}

export default Home;
