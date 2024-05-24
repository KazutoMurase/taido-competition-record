export function GetEventName(event_id) {
  const id = parseInt(event_id);
  if (id === 1) {
    return "zissen_man";
  } else if (id === 2) {
    return "hokei_man";
  } else if (id === 3) {
    return "zissen_woman";
  } else if (id === 4) {
    return "hokei_woman";
  } else if (id === 5) {
    return "hokei_sonen";
  } else if (id === 6) {
    return "dantai_zissen_woman";
  } else if (id === 7) {
    return "dantai_zissen_man";
  } else if (id === 12) {
    return "hokei_newcommer";
  }
  return "dantai";
}
