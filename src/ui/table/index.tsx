import { FC } from 'react';
import { IpcRow } from './row';
import { LogData } from '../../shared';

export type Props = {
  data: ReadonlyArray<LogData>;
};

export const IpcTable: FC<Props> = ({ data }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Time</th>
          <th>Channel</th>
          <th>Data</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <IpcRow key={i} index={i} data={row} />
        ))}
      </tbody>
    </table>
  );
};
