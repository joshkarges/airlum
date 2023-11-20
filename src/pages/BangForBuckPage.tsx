import { Button, LinearProgress, TextField } from "@mui/material";
import { useState } from "react";
import { create } from "../api/MongoDbApi";
import { Flex } from "../components/Flex";

export const BangForBuckPage = () => {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  return (
    <div>
      <div>BangForBuckPage</div>
      <Flex>
        <TextField value={value} onChange={(evt) => setValue(evt.target.value)}/>
        <Button onClick={async () => {
          setLoading(true);
          setResponse(await create({title: value}, 'tasks'));
          setLoading(false);
        }}>
          Create
        </Button>
      </Flex>
      {loading && <LinearProgress/>}
      {response && <div style={{whiteSpace: 'pre'}}>{JSON.stringify(response, null, 2)}</div>}
    </div>
  );
};