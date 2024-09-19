import { FC } from 'react';
import { IpcLogData } from '../../shared';

export type Props = {
  data: IpcLogData;
};

export const IpcRow: FC<Props> = ({ data }) => {
  return (
    <tr>
      <td>{data.n}</td>
      <td>{data.t}</td>
      <td>{data.channel}</td>
      <td>{JSON.stringify(data.args)}</td>
    </tr>
  );
};
