### Общее описание
Утилита предназначена для тестирования производительности решений для модели авторизации RBAC:
* [casbin](https://casbin.org/docs/en/overview)
* самописное решение (handmade) с использованием прямых sql запросов
* самописное решение с использованием ORM Sequelize

**Node.js**: v.18.12.0 (LTS)

### Подключение к БД
CLI работает с СУБД PostgreSQL. Настройки подключения в файлах DB и ORMDB. Второе подключение с флагом prodMode == false используется для автотестов.

### Команды CLI
---
```
list obj group={num} type={num} rep={num}
```
Запрос на получение объектов указанного типа в рамках указанной группы

**Использует авторизацию**
  * Да

**Аргументы**
  * (_string_) group - номер группы объектов
  * (_string_) type - номер типа объектов в рамках указанной группы
  * (_string_) rep - количество итераций работы инфорсера

**Вернёт**
  * (_string_) список объектов при наличии доступа или сообщение с отказом доступа

**Пример**
```
list obj group=3 type=2 rep=10
```

---
```
list obj group={num} rep={num}
```
Запрос объектов всех доступных типов в рамках указанной группы

**Использует авторизацию**
  * Да

**Аргументы**
  * (_string_) group - номер группы объектов
  * (_string_) type - номер типа объектов в рамках указанной группы
  * (_string_) rep - количество итераций работы инфорсера

**Вернёт**
  * (_string_) список объектов доступных типов в рамках группы или сообщение с отказом доступа

**Пример**
```
list obj group=2 rep=1
```

---
```
prep data{num} pools={num}
```
Генерация тестовых данных на основе пулов (_Pools_)

**Использует авторизацию**
  * Нет

**Аргументы**
  * (_string_) data
    * 1 - данные для casbin
    * 2 - данные для handmade
  * (_string_) pools - количество пулов данных

**Вернёт**
  * (_string_) сообщение об успехе операции

**Пример**
```
prep data1 pools=5
```