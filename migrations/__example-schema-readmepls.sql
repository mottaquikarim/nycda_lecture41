--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE Users (
  id   INTEGER PRIMARY KEY,
  name TEXT    NOT NULL,
  email TEXT   NOT NULL
);

CREATE TABLE Places (
  id   INTEGER PRIMARY KEY,
  name TEXT    NOT NULL,
  lat REAL   NOT NULL,
  lng REAL   NOT NULL
);

CREATE TABLE Checkins (
    id   INTEGER PRIMARY KEY,
    user_id INTEGER,
    place_id INTEGER
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE Users;
DROP TABLE Places;
DROP TABLE Checkins;
