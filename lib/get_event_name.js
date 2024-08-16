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
  } else if (id === 8) {
    return "dantai_hokei_man";
  } else if (id === 9) {
    return "dantai_hokei_woman";
  } else if (id === 12) {
    return "hokei_newcommer";
  } else if (id === 13) {
    return "zissen_kyuui_man";
  } else if (id === 14) {
    return "hokei_kyuui_man";
  } else if (id === 15) {
    return "zissen_kyuui_woman";
  } else if (id === 16) {
    return "hokei_kyuui_woman";
  } else if (id === 17) {
    return "dantai_zissen";
  } else if (id === 18) {
    return "dantai_hokei";
  } else if (id === 19) {
    return "tenkai";
  } else if (id === 20) {
    return "hokei_kyuui";
  } else if (id === 21) {
    return "zissen_sonen_man";
  } else if (id === 22) {
    return "zissen_sonen_woman";
  } else if (id === 23) {
    return "hokei_sei";
  } else if (id === 24) {
    return "hokei_mei";
  } else if (id === 25) {
    return "hokei_mei_kyuui_newcommer";
  }
  return "dantai";
}
