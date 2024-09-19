import { FC } from 'react';
import { IpcRow } from './row';
import { IpcLogData } from '../../shared';

export type Props = {
  data: ReadonlyArray<IpcLogData>;
};

export const IpcTable: FC<Props> = ({ data }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>N</th>
          <th>Time</th>
          <th>Channel</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <IpcRow key={i} data={row} />
        ))}
      </tbody>
    </table>
  );
};
