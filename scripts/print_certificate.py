#!/usr/bin/env python3
import click
import sys
from PyQt5.QtWidgets import (
    QApplication, QWidget, QLabel, QPushButton,
    QGridLayout, QHBoxLayout
)
from functools import partial
import importlib.util
import os
import requests
import zipfile
from lxml import etree
import shutil

col_text = ["優勝", "第二位", "第三位"]
# TODO: get from awarded_players
awards_text = ["最優秀選手賞", "優秀選手賞1", "優秀選手賞2", "日本武藝躰道本院杯"]

app = QApplication(sys.argv)


def is_module_available(module_name):
    return importlib.util.find_spec(module_name) is not None


def exec_print(doc_path, open_only):
    import win32com.client
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = open_only
    doc = word.Documents.Open(doc_path)
    if not open_only:
        # TODO: set printer name
        printer_name = "Your Printer Name"
        word.ActivePrinter = printer_name
        doc.PrintOut(
            Background=True,
            Copies=1,
            PageType=0
        )
        doc.Close(SaveChanges=False)
        word.Quit()


def on_button_click(row, col, url_base, row_text, event_names, input_words_dir, open_only):
    if row < 0:
        rank = ""
        event = awards_text[col].replace("1", "").replace("2", "")
        url = f"{url_base}/api/get_awarded_players"
    else:
        rank = col_text[col]
        event = row_text[row]
        url = f"{url_base}/api/get_winners?event_name={event_names[row]}"
    response = requests.get(url)
    if response.status_code == 200:
        if row < 0:
            name = response.json()[col]["name"]
        elif ("dantai" in event_names[row] or
              "tenkai" in event_names[row]):
            name = response.json()[f"{col+1}"]["group"]
        elif "total" in event_names[row]:
            name = response.json()[f"{col+1}"]["group"]
        else:
            name = response.json()[f"{col+1}"]["name"].replace('　', ' ')

    docx_file = f'{input_words_dir}/base.docx'
    temp_dir = 'temp_unzip_dir'

    with zipfile.ZipFile(docx_file, 'r') as zip_ref:
        zip_ref.extractall(temp_dir)

    document_path = os.path.join(temp_dir, 'word/document.xml')

    tree = etree.parse(document_path)
    root = tree.getroot()

    for elem in root.getiterator():
        if not elem.text:
            continue
        if "競技名" in elem.text:
            elem.text = event
        if "ランク" in elem.text:
            elem.text = rank
        if "名前" in elem.text:
            elem.text = name

    tree.write(document_path, xml_declaration=True, encoding='utf-8')

    if row < 0:
        new_docx_file = f'{event}.docx'
    else:
        new_docx_file = f'{rank}_{event}.docx'
    with zipfile.ZipFile(new_docx_file, 'w') as zip_ref:
        for foldername, subfolders, filenames in os.walk(temp_dir):
            for filename in filenames:
                file_path = os.path.join(foldername, filename)
                arcname = os.path.relpath(file_path, temp_dir)
                zip_ref.write(file_path, arcname)

    shutil.rmtree(temp_dir)
    if is_module_available("win32com"):
        exec_print(f"{os.path.dirname(os.path.abspath(__file__))}/{new_docx_file}",
                   open_only)

    button = app.sender()
    button.setStyleSheet("background-color: lightgreen; color: black;")


class MyApp(QWidget):
    def __init__(self, url, input_words_dir, open_only):
        super().__init__()
        self.setWindowTitle('賞状印刷')
        self.setGeometry(100, 100, 400, 300)

        response = requests.get(f"{url}/api/get_events")
        row_text = []
        event_names = []
        for i, elem in enumerate(response.json()):
            if elem["existence"] and "全日程終了" not in elem["name"]:
                row_text.append(elem["name"].replace("'", ""))
                event_names.append(elem["name_en"])
        row_text.append("総合")
        event_names.append("total")

        main_layout = QHBoxLayout()

        button_layout = QGridLayout()
        for row in range(len(row_text)-1):
            label = QLabel(f'{row_text[row]}', self)
            button_layout.addWidget(label, row, 0)
            for col in range(3):
                button = QPushButton(f'{col_text[col]}', self)
                button.clicked.connect(partial(on_button_click,
                                               row, col, url,
                                               row_text, event_names,
                                               input_words_dir, open_only))
                if os.path.exists(f'{col_text[col]}_{row_text[row]}.docx'):
                    button.setStyleSheet("background-color: lightgreen; color: black;")
                button_layout.addWidget(button, row, col+1)

        button_layout.addWidget(QLabel("褒章", self), len(row_text), 0)
        for col in range(len(awards_text)):
            button = QPushButton(f'{awards_text[col]}', self)
            button.clicked.connect(partial(on_button_click, -1, col, url,
                                           row_text, event_names,
                                           input_words_dir, open_only))
            if os.path.exists(f'{awards_text[col].replace("1", "").replace("2", "")}.docx'):
                button.setStyleSheet("background-color: lightgreen; color: black;")
            button_layout.addWidget(button, len(row_text), col+1)

        main_layout.addLayout(button_layout)

        self.setLayout(main_layout)


@click.command()
@click.option("--url", type=str, required=True)
@click.option("--input-words-dir", type=click.Path(dir_okay=True), required=True)
@click.option("--open-only", type=bool, default=False)
def main(url, input_words_dir, open_only):
    window = MyApp(url, input_words_dir, open_only)
    window.show()
    sys.exit(app.exec_())


if __name__ == '__main__':
    main()
