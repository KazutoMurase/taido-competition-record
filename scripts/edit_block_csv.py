#!/usr/bin/env python3
import sys
import os
import csv
from PyQt5.QtWidgets import (
    QApplication, QWidget, QLabel, QPushButton, QVBoxLayout, QHBoxLayout,
    QFormLayout, QLineEdit, QComboBox, QTableWidget, QTableWidgetItem,
    QHeaderView, QCheckBox, QSpinBox, QMessageBox, QInputDialog
)
from PyQt5.QtCore import Qt


class BlockCSVEditor(QWidget):
    def __init__(self, tournament_name, block_name):
        super().__init__()
        self.tournament_name = tournament_name
        self.block_name = block_name
        
        # ファイルパス設定
        self.base_dir = f"data/{tournament_name}/original"
        self.csv_file = f"{self.base_dir}/block_{block_name.lower()}.csv"
        self.event_type_file = f"data/{tournament_name}/static/event_type.csv"
        
        # データ格納用
        self.data = []
        self.event_types = {}
        
        self.init_ui()
        self.load_event_types()
        self.load_csv_data()
        
    def init_ui(self):
        self.setWindowTitle(f'Block {self.block_name.upper()} CSV Editor - {self.tournament_name}')
        self.setGeometry(100, 100, 800, 600)
        
        main_layout = QVBoxLayout()
        
        # ヘッダー
        header_layout = QHBoxLayout()
        header_layout.addWidget(QLabel(f"Tournament: {self.tournament_name}"))
        header_layout.addWidget(QLabel(f"Block: {self.block_name.upper()}"))
        main_layout.addLayout(header_layout)
        
        # テーブル
        self.table = QTableWidget()
        self.table.setColumnCount(7)
        self.table.setHorizontalHeaderLabels([
            'ID', 'Event Type', 'Time Schedule', 'Before Final', 
            'Final', 'Players Checked', 'Next Unused Num'
        ])
        
        # テーブルの列幅を調整
        header = self.table.horizontalHeader()
        header.setSectionResizeMode(0, QHeaderView.ResizeToContents)  # ID
        header.setSectionResizeMode(1, QHeaderView.Stretch)  # Event Type
        header.setSectionResizeMode(2, QHeaderView.Stretch)  # Time Schedule
        header.setSectionResizeMode(3, QHeaderView.ResizeToContents)  # Before Final
        header.setSectionResizeMode(4, QHeaderView.ResizeToContents)  # Final
        header.setSectionResizeMode(5, QHeaderView.ResizeToContents)  # Players Checked
        header.setSectionResizeMode(6, QHeaderView.ResizeToContents)  # Next Unused Num
        
        main_layout.addWidget(self.table)
        
        # エディット用フォーム
        form_layout = QFormLayout()
        
        self.id_input = QSpinBox()
        self.id_input.setMinimum(1)
        self.id_input.setMaximum(999)
        form_layout.addRow("ID:", self.id_input)
        
        self.event_combo = QComboBox()
        form_layout.addRow("Event Type:", self.event_combo)
        
        self.time_input = QLineEdit()
        self.time_input.setPlaceholderText("e.g., 9:15-10:10")
        form_layout.addRow("Time Schedule:", self.time_input)
        
        self.before_final_cb = QCheckBox()
        form_layout.addRow("Before Final:", self.before_final_cb)
        
        self.final_cb = QCheckBox()
        form_layout.addRow("Final:", self.final_cb)
        
        self.players_checked_cb = QCheckBox()
        form_layout.addRow("Players Checked:", self.players_checked_cb)
        
        self.next_unused_num_input = QSpinBox()
        self.next_unused_num_input.setMinimum(0)
        self.next_unused_num_input.setMaximum(999)
        form_layout.addRow("Next Unused Num:", self.next_unused_num_input)
        
        main_layout.addLayout(form_layout)
        
        # ボタン
        button_layout = QHBoxLayout()
        
        add_button = QPushButton("Add Row")
        add_button.clicked.connect(self.add_row)
        button_layout.addWidget(add_button)
        
        update_button = QPushButton("Update Selected")
        update_button.clicked.connect(self.update_selected_row)
        button_layout.addWidget(update_button)
        
        delete_button = QPushButton("Delete Selected")
        delete_button.clicked.connect(self.delete_selected_row)
        button_layout.addWidget(delete_button)
        
        generate_button = QPushButton("Generate CSV")
        generate_button.clicked.connect(self.generate_csv)
        generate_button.setStyleSheet("background-color: #4CAF50; color: white; font-weight: bold;")
        button_layout.addWidget(generate_button)
        
        main_layout.addLayout(button_layout)
        
        self.setLayout(main_layout)
        
        # テーブルの行選択イベント
        self.table.itemSelectionChanged.connect(self.on_row_selected)
        
    def load_event_types(self):
        """event_type.csvからイベント情報を読み込み"""
        try:
            with open(self.event_type_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # 全てのイベントを読み込み（existence関係なく）
                    self.event_types[int(row['id'])] = row['name']
            
            # コンボボックスに追加
            self.event_combo.clear()
            for event_id, event_name in sorted(self.event_types.items()):
                self.event_combo.addItem(f"{event_id}: {event_name}", event_id)
                
        except FileNotFoundError:
            QMessageBox.warning(self, "Warning", f"Event type file not found: {self.event_type_file}")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to load event types: {str(e)}")
    
    def load_csv_data(self):
        """CSVファイルからデータを読み込み"""
        self.data = []
        
        if not os.path.exists(self.csv_file):
            # ファイルが存在しない場合は空のテーブルを表示
            self.update_table()
            return
            
        try:
            with open(self.csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    self.data.append({
                        'id': int(row['id']),
                        'event_id': int(row['event_id']),
                        'time_schedule': row['time_schedule'].strip("'"),
                        'before_final': int(row['before_final']),
                        'final': int(row['final']),
                        'players_checked': int(row['players_checked']),
                        'next_unused_num': int(row['next_unused_num'])
                    })
            
            self.update_table()
            
        except FileNotFoundError:
            QMessageBox.information(self, "Info", f"CSV file not found. Starting with empty data: {self.csv_file}")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to load CSV: {str(e)}")
    
    def update_table(self):
        """テーブルの表示を更新"""
        self.table.setRowCount(len(self.data))
        
        for row, item in enumerate(self.data):
            self.table.setItem(row, 0, QTableWidgetItem(str(item['id'])))
            
            # イベント名を表示
            event_name = self.event_types.get(item['event_id'], f"Unknown ({item['event_id']})")
            self.table.setItem(row, 1, QTableWidgetItem(f"{item['event_id']}: {event_name}"))
            
            self.table.setItem(row, 2, QTableWidgetItem(item['time_schedule']))
            self.table.setItem(row, 3, QTableWidgetItem("Yes" if item['before_final'] else "No"))
            self.table.setItem(row, 4, QTableWidgetItem("Yes" if item['final'] else "No"))
            self.table.setItem(row, 5, QTableWidgetItem("Yes" if item['players_checked'] else "No"))
            self.table.setItem(row, 6, QTableWidgetItem(str(item['next_unused_num'])))
    
    def on_row_selected(self):
        """テーブルの行が選択された時の処理"""
        current_row = self.table.currentRow()
        if current_row >= 0 and current_row < len(self.data):
            item = self.data[current_row]
            
            self.id_input.setValue(item['id'])
            
            # イベントタイプの選択
            for i in range(self.event_combo.count()):
                if self.event_combo.itemData(i) == item['event_id']:
                    self.event_combo.setCurrentIndex(i)
                    break
            
            self.time_input.setText(item['time_schedule'])
            self.before_final_cb.setChecked(bool(item['before_final']))
            self.final_cb.setChecked(bool(item['final']))
            self.players_checked_cb.setChecked(bool(item['players_checked']))
            self.next_unused_num_input.setValue(item['next_unused_num'])
    
    def clear_form(self):
        """フォームをクリア"""
        self.id_input.setValue(1)
        self.event_combo.setCurrentIndex(0)
        self.time_input.clear()
        self.before_final_cb.setChecked(False)
        self.final_cb.setChecked(False)
        self.players_checked_cb.setChecked(False)
        self.next_unused_num_input.setValue(0)
    
    def add_row(self):
        """新しい行を追加（選択行の下に挿入）"""
        if self.event_combo.currentData() is None:
            QMessageBox.warning(self, "Warning", "Please select an event type.")
            return
        
        new_item = {
            'id': self.id_input.value(),
            'event_id': self.event_combo.currentData(),
            'time_schedule': self.time_input.text(),
            'before_final': 1 if self.before_final_cb.isChecked() else 0,
            'final': 1 if self.final_cb.isChecked() else 0,
            'players_checked': 1 if self.players_checked_cb.isChecked() else 0,
            'next_unused_num': self.next_unused_num_input.value()
        }
        
        # 選択行の下に挿入
        current_row = self.table.currentRow()
        if current_row >= 0:
            # 選択された行の下に挿入
            self.data.insert(current_row + 1, new_item)
        else:
            # 選択がない場合は末尾に追加
            self.data.append(new_item)
        
        self.update_table()
        self.clear_form()
        
        # 次のIDを自動で設定
        if self.data:
            max_id = max(item['id'] for item in self.data)
            self.id_input.setValue(max_id + 1)
        
        # 新しく追加された行を選択
        if current_row >= 0:
            self.table.selectRow(current_row + 1)
    
    def update_selected_row(self):
        """選択された行を更新"""
        current_row = self.table.currentRow()
        if current_row < 0:
            QMessageBox.warning(self, "Warning", "Please select a row to update.")
            return
        
        if self.event_combo.currentData() is None:
            QMessageBox.warning(self, "Warning", "Please select an event type.")
            return
        
        self.data[current_row] = {
            'id': self.id_input.value(),
            'event_id': self.event_combo.currentData(),
            'time_schedule': self.time_input.text(),
            'before_final': 1 if self.before_final_cb.isChecked() else 0,
            'final': 1 if self.final_cb.isChecked() else 0,
            'players_checked': 1 if self.players_checked_cb.isChecked() else 0,
            'next_unused_num': self.next_unused_num_input.value()
        }
        
        self.update_table()
    
    def delete_selected_row(self):
        """選択された行を削除"""
        current_row = self.table.currentRow()
        if current_row < 0:
            QMessageBox.warning(self, "Warning", "Please select a row to delete.")
            return
        
        reply = QMessageBox.question(self, "Confirm Delete", 
                                   "Are you sure you want to delete this row?",
                                   QMessageBox.Yes | QMessageBox.No)
        
        if reply == QMessageBox.Yes:
            del self.data[current_row]
            self.update_table()
            self.clear_form()
    
    def generate_csv(self):
        """CSVファイルを生成"""
        if not self.data:
            QMessageBox.warning(self, "Warning", "No data to save.")
            return
        
        try:
            # ディレクトリが存在しない場合は作成
            os.makedirs(self.base_dir, exist_ok=True)
            
            with open(self.csv_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                
                # ヘッダー
                writer.writerow(['id', 'event_id', 'time_schedule', 'before_final', 
                               'final', 'players_checked', 'next_unused_num'])
                
                # データ
                for item in sorted(self.data, key=lambda x: x['id']):
                    writer.writerow([
                        item['id'],
                        item['event_id'],
                        f"'{item['time_schedule']}'" if item['time_schedule'] else "''",
                        item['before_final'],
                        item['final'],
                        item['players_checked'],
                        item['next_unused_num']
                    ])
            
            QMessageBox.information(self, "Success", f"CSV file generated successfully:\n{self.csv_file}")
            
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to generate CSV: {str(e)}")


def main():
    app = QApplication(sys.argv)
    
    # コマンドライン引数またはダイアログで大会名とブロック名を取得
    if len(sys.argv) >= 3:
        tournament_name = sys.argv[1]
        block_name = sys.argv[2]
    else:
        # ダイアログで入力を求める
        tournament_name, ok1 = QInputDialog.getText(None, "Tournament Name", 
                                                   "Enter tournament name (e.g., 2025_sogenhai):")
        if not ok1 or not tournament_name:
            sys.exit()
        
        block_name, ok2 = QInputDialog.getText(None, "Block Name", 
                                             "Enter block name (e.g., A, B, C, D):")
        if not ok2 or not block_name:
            sys.exit()
    
    window = BlockCSVEditor(tournament_name, block_name)
    window.show()
    
    sys.exit(app.exec_())


if __name__ == '__main__':
    main()