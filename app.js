const express = require("express");

const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const { parseISO, format, isValid } = require("date-fns");
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`server error is ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const checkStatus = (requests) => {
  if (requests.status === "TO DO") {
    return true;
  } else if (requests.status === "IN PROGRESS") {
    return true;
  } else if (requests.status === "DONE") {
    return true;
  } else {
    return false;
  }
};

const checkPriority = (requests) => {
  if (requests.priority === "HIGH") {
    return true;
  } else if (requests.priority === "MEDIUM") {
    return true;
  } else if (requests.priority === "LOW") {
    return true;
  } else {
    return false;
  }
};

const checkCategory = (requests) => {
  if (
    requests.category === "HOME" ||
    requests.category === "WORK" ||
    requests.category === "LEARNING"
  ) {
    return true;
  } else {
    return false;
  }
};

const checkDueDate = (date) => {
  if (isValid(date)) {
    return true;
  } else {
    return false;
  }
};

const checkPriorityAndStatus = (requests) => {
  if (
    (requests.priority === "HIGH" ||
      requests.priority === "MEDIUM" ||
      requests.priority === "LOW") &&
    (requests.status === "TO DO" ||
      requests.status === "IN PROGRESS" ||
      requests.status === "DONE")
  ) {
    return true;
  } else {
    return false;
  }
};

const hasStatus = (request) => {
  return request.status !== undefined;
};

const hasPriority = (request) => {
  return request.priority !== undefined;
};

const hasCategory = (request) => {
  return request.category !== undefined;
};

const hasDueDate = (request) => {
  return request.dueDate !== undefined;
};

const hasTodo = (request) => {
  return request.todo !== undefined;
};

const hasPriorityAndStatus = (request) => {
  return request.priority !== undefined && request.status !== undefined;
};

const hasCategoryAndStatus = (request) => {
  return request.category !== undefined && request.status !== undefined;
};

const hasCategoryAndPriority = (request) => {
  return request.category !== undefined && request.priority !== undefined;
};

app.get("/todos/", async (request, response) => {
  const { status, category, priority, search_q = "" } = request.query;
  let getQuery;
  switch (true) {
    case hasPriorityAndStatus(request.query):
      if (checkPriorityAndStatus(request.query)) {
        getQuery = `
            select *
            from todo
            where status='${status}' and priority='${priority}'`;
      } else {
        if (checkPriority(request.query) === false) {
          response.status(400);
          response.send("Invalid Todo Priority");
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      }
      break;
    case hasCategoryAndStatus(request.query):
      if (checkStatus(request.query) && checkCategory(request.query)) {
        getQuery = `
            select *
            from todo
            where status='${status}' and category='${category}'`;
      } else {
        if (checkStatus(request.query) === false) {
          response.status(400);
          response.send("Invalid Todo Status");
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      }
      break;
    case hasCategoryAndPriority(request.query):
      if (checkCategory(request.query) && checkPriority(request.query)) {
        getQuery = `
            select *
            from todo
            where category='${category}' and priority='${priority}'`;
      } else {
        if (checkCategory(request.query) === false) {
          response.status(400);
          response.send("Invalid Todo Category");
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      }
      break;
    case hasStatus(request.query):
      if (checkStatus(request.query)) {
        getQuery = `
                select *
                from todo
                where status='${status}'`;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriority(request.query):
      if (checkPriority(request.query)) {
        getQuery = `
            select *
            from todo
            where priority='${priority}'`;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategory(request.query):
      if (checkCategory(request.query)) {
        getQuery = `
            select *
            from todo
            where category='${category}'`;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getQuery = `
          select *
          from todo
          where todo like '%${search_q}%'`;
  }
  const QueryResponse = await db.all(getQuery);
  response.send(QueryResponse);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getIdQuery = `
    select *
    from todo
    where id=${todoId}`;
  const getIdResponse = await db.get(getIdQuery);
  response.send(getIdResponse);
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const formatedDate = format(new Date(date), "yyyy-MM-dd");
  if (hasDueDate(formatedDate)) {
    if (isValid(formatedDate)) {
      const getDateQuery = `
    select *
    from todo
    where due_date='${formatedDate}'`;
      const responseDate = await db.all(getDateQuery);
      response.send(responseDate);
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, category, status, priority, dueDate } = request.body;
  const parseDate = parseISO(dueDate);
  if (
    checkCategory(request.body) &&
    checkPriority(request.body) &&
    checkStatus(request.body) &&
    isValid(parseDate)
  ) {
    const PostQuery = `
      insert into todo(id,todo,category,status,priority,due_date)
      values(${id},'${todo}','${category}','${status}','${priority}','${dueDate}')`;
    await db.run(PostQuery);
    response.send("Todo Successfully Added");
  } else {
    if (checkCategory(request.body) === false) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else if (checkPriority(request.body) === false) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else if (checkStatus(request.body) === false) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else if (isValid(parseDate) === false) {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, category, priority, todo, dueDate } = request.body;
  let putQuery;
  switch (true) {
    case hasStatus(request.body):
      if (checkStatus(request.body)) {
        putQuery = `
                update todo
                set status='${status}'
                where id=${todoId}`;
        await db.run(putQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriority(request.body):
      if (checkPriority(request.body)) {
        putQuery = `
                update todo
                set priority='${priority}'
                where id=${todoId}`;
        await db.run(putQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategory(request.body):
      if (checkCategory(request.body)) {
        putQuery = `
                update todo
                set category='${category}'
                where id=${todoId}`;
        await db.run(putQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasTodo(request.body):
      putQuery = `
            update todo
            set todo='${todo}'
            where id=${todoId}`;
      await db.run(putQuery);
      response.send("Todo Updated");
      break;
    case hasDueDate(request.body):
      const parseDate = parseISO(dueDate);
      if (isValid(parseDate)) {
        putQuery = `
          update todo set due_date='${dueDate}'
          where id=${todoId}`;
        await db.run(putQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    delete from todo where id=${todoId}`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
