import { FC } from 'react';
import { LogData } from '../../shared';

export type Props = {
  index: number;
  data: LogData;
};

export const IpcRow: FC<Props> = ({ index, data }) => {
  return (
    <tr>
      <td>{index + 1}</td>
      <td>{data.t}</td>
      <td>{data.channel}</td>
      <td>{JSON.stringify(data.args)}</td>
    </tr>
  );
};
