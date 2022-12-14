## Общее описание
Утилита предназначена для тестирования производительности решений для модели авторизации RBAC:
* [casbin](https://casbin.org/docs/en/overview)
* самописное решение (_handmade_) с использованием инлайн sql-запросов
* самописное решение с использованием ORM Sequelize

Перед использоватем требуется установить СУБД PostgreSQL и подготовить таблицы из статьи. Добавить в таблицу Auth одну учётную запись для первого входа.

**Node.js**: v.18.12.0 (LTS)

## Подключение к БД
CLI работает с СУБД PostgreSQL. Настройки подключения в файлах DB и ORMDB. Второе подключение с флагом prodMode == false используется для автотестов.

## Вход
Для входа используется учётная запись из таблицы Auth.

## Команды CLI
### Запрос на получение объектов указанного типа в рамках указанной группы
```
list obj group={n} type={m} rep={k}
```

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

### Запрос объектов всех доступных типов в рамках указанной группы
```
list obj group={n} rep={k}
```

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

### Генерация тестовых данных на основе пулов (_Pools_)
```
prep data{n} pools={m}
```

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