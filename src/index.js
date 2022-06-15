const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");
const { json } = require("express");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function usernameExists(username) {
  return users.some((user) => user.username === username);
}

function findUser(username) {
  return users.find((user) => user.username === username);
}

function findTodo(todos, uuid) {
  return todos.find((todo) => todo.id === uuid);
}

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const user = findUser(username);

  if (!user) {
    return response.status(404).json({ error: "User does not extist!" });
  }

  request.user = user;

  return next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  if (usernameExists(username)) {
    return response.status(400).json({ error: "Username already exists!" });
  }

  const user = {
    name,
    username,
    id: uuidv4(),
    todos: [],
  };

  users.push(user);

  return response.status(201).json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { todos } = request.user;

  return response.json(todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { todos } = request.user;
  const { title, deadline } = request.body;

  const todo = {
    title,
    deadline,
    done: false,
    id: uuidv4(),
    created_at: new Date(),
  };

  todos.push(todo);

  return response.status(201).json(todo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { todos } = request.user;
  const { id } = request.params;
  const { title, deadline } = request.body;

  let todo = findTodo(todos, id);

  if (!todo) {
    return response.status(404).json({ error: "Todo does not extist!" });
  }

  todo = { ...todo, title, deadline };

  request.user.todos = todos.map((item) => {
    if (item.id === todo.id) {
      return todo;
    }
    return item;
  });

  return response.json(todo);
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const { todos } = request.user;
  const { id } = request.params;

  const todo = findTodo(todos, id);

  if (!todo) {
    return response.status(404).json({ error: "Todo does not extist!" });
  }

  todo.done = true;

  request.user.todos = todos.map((item) => {
    if (item.id === todo.id) {
      return todo;
    }
    return item;
  });

  return response.json(todo);
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { todos } = request.user;
  const { id } = request.params;

  const todo = findTodo(todos, id);

  if (!todo) {
    return response.status(404).json({ error: "Todo does not extist!" });
  }

  todos.splice(todo, 1);

  return response.status(204).json(todos);
});

module.exports = app;
