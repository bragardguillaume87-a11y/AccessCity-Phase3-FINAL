import { useCallback, useRef, useState } from 'react';

function cloneJsonSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

export default function useUndoRedo(initialState) {
  const initialRef = useRef(cloneJsonSafe(initialState));
  const [present, setPresent] = useState(cloneJsonSafe(initialState));
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const setState = useCallback((next) => {
    setPresent((current) => {
      const nextValue = typeof next === 'function' ? next(current) : next;
      setPast((p) => [...p, cloneJsonSafe(current)]);
      setFuture([]);
      return cloneJsonSafe(nextValue);
    });
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1];
      setFuture((f) => [cloneJsonSafe(present), ...f]);
      setPresent(cloneJsonSafe(prev));
      return p.slice(0, -1);
    });
  }, [present]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setPast((p) => [...p, cloneJsonSafe(present)]);
      setPresent(cloneJsonSafe(next));
      return f.slice(1);
    });
  }, [present]);

  return { state: present, setState, undo, redo, canUndo, canRedo };
}
