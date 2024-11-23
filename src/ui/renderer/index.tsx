import { CSSProperties, FC } from 'react';
import { clsx } from 'clsx';

import { IpcTable } from '../table';
import { useRenderer } from './hooks';

import styles from './renderer.module.scss';
import { TopBar } from '../top-bar';
import { DataPanel } from '../data-panel';

/**
 * Container view for the renderer.
 * The (small) logic to view messages and data is managed here
 */
export const Renderer: FC = () => {
  const {
    logData,
    panelPosition,
    panelWidth,
    panelHeight,
    isPanelOpen,
    selectedMsg,
    displayRelativeTimes,
    sortBy,
    sortReverse,
    filter,
    isFilterInverted,
    onDragStart,
    onDrag,
    closePanel,
    setPanelPosition,
    setSelectedIpcMsg,
    setDisplayRelativeTimes,
    setSortCriteria,
    updateFilter,
    clearMessages,
  } = useRenderer();

  const gridStyle = {
    '--data-panel-width': `${panelWidth}px`,
    '--data-panel-height': `${panelHeight}px`,
  } as CSSProperties;

  return (
    <div
      className={clsx(
        styles.root,
        styles[panelPosition],
        !isPanelOpen && styles.closed
      )}
      style={gridStyle}
    >
      <div className={styles.topBar}>
        <TopBar
          onUseRelativeTimes={setDisplayRelativeTimes}
          relativeTimes={displayRelativeTimes}
          setFilter={updateFilter}
          clearMessages={clearMessages}
        />
      </div>
      <div className={styles.main}>
        <IpcTable
          data={logData}
          selectedMsg={selectedMsg}
          relativeTimes={displayRelativeTimes}
          sortBy={sortBy}
          sortReverse={sortReverse}
          filter={filter}
          filterInverted={isFilterInverted}
          setSortBy={setSortCriteria}
          onRowClick={setSelectedIpcMsg}
        />
      </div>
      <div className={styles.panel}>
        {selectedMsg && (
          <>
            <div
              draggable={true}
              className={styles.draggable}
              onDragStart={onDragStart}
              onDrag={onDrag}
            />
            <DataPanel
              position={panelPosition}
              data={selectedMsg}
              relativeTimes={displayRelativeTimes}
              closePanel={closePanel}
              setPanelPosition={setPanelPosition}
            />
          </>
        )}
      </div>
    </div>
  );
};
