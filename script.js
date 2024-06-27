document.addEventListener("DOMContentLoaded", () => {
  const addTaskBtn = document.getElementById("add-task");
  const newTaskInput = document.getElementById("new-task");
  const taskList = document.getElementById("task-list");
  const exportCsvBtn = document.getElementById("export-csv");
  const youtube = document.getElementById("youtube");

  loadTasks();

  addTaskBtn.addEventListener("click", addTask);
  exportCsvBtn.addEventListener("click", exportToCsv);
  youtube.addEventListener("click", youtubeChannel);

  function addTask() {
    const taskText = newTaskInput.value.trim();
    if (taskText) {
      const taskItem = createTaskItem(taskText);
      taskList.appendChild(taskItem);
      newTaskInput.value = "";

      // Automatically set 'Todo' tag as active and save the start date
      const todoTag = taskItem.querySelector(".tag.Todo");
      setActiveTag(todoTag, taskItem);

      saveTasks();
      updateTaskCounts();
    }
  }

  function createTaskItem(text) {
    const taskItem = document.createElement("div");
    taskItem.className = "task-item";

    const taskInput = document.createElement("input");
    taskInput.type = "text";
    taskInput.value = text;
    taskInput.className = "form-control mb-2";

    const tagContainer = document.createElement("div");
    tagContainer.className = "tag-container mb-2";

    const tags = ["Todo", "Process", "Test", "Done"];
    tags.forEach((tag) => {
      const tagElement = document.createElement("span");
      tagElement.className = `tag ${tag}`;
      tagElement.textContent = tag;
      tagElement.addEventListener("click", () =>
        setActiveTag(tagElement, taskItem)
      );
      tagContainer.appendChild(tagElement);
    });

    const dateContainer = document.createElement("div");
    dateContainer.className = "date-container";

    const dates = ["Start", "Process", "Test", "End"].map((stage) => {
      const dateElement = document.createElement("div");
      dateElement.innerHTML = `<strong>${stage}:</strong> <span>-</span>`;
      return dateElement;
    });

    dates.forEach((date) => dateContainer.appendChild(date));

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "btn btn-danger btn-sm mt-2";
    deleteBtn.addEventListener("click", () => deleteTask(taskItem));

    taskItem.appendChild(taskInput);
    taskItem.appendChild(tagContainer);
    taskItem.appendChild(dateContainer);
    taskItem.appendChild(deleteBtn);

    return taskItem;
  }

  function setActiveTag(tagElement, taskItem) {
    const tags = taskItem.querySelectorAll(".tag");
    tags.forEach((tag) => tag.classList.remove("active"));
    tagElement.classList.add("active");

    const dateContainer = taskItem.querySelector(".date-container");
    const currentStage = tagElement.textContent;
    let dateIndex;

    switch (currentStage) {
      case "Todo":
        dateIndex = 0;
        break;
      case "Process":
        dateIndex = 1;
        break;
      case "Test":
        dateIndex = 2;
        break;
      case "Done":
        dateIndex = 3;
        break;
    }

    const dateElement = dateContainer.children[dateIndex].querySelector("span");
    dateElement.textContent = new Date().toLocaleDateString();

    if (currentStage === "Process") {
      const todoDate = new Date(
        dateContainer.querySelector("div:nth-child(1) span").textContent
      );
      const currentDate = new Date();
      const daysDiff = Math.floor(
        (currentDate - todoDate) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff > 3) {
        alert("This task has been in process for more than 3 days!");
      }
    }

    saveTasks();
    updateTaskCounts();
  }

  function deleteTask(taskItem) {
    if (confirm("Are you sure you want to delete this task?")) {
      taskItem.remove();
      saveTasks();
      updateTaskCounts();
    }
  }

  function saveTasks() {
    const tasks = [];
    document.querySelectorAll(".task-item").forEach((taskItem) => {
      const taskInput = taskItem.querySelector("input");
      const activeTag = taskItem.querySelector(".tag.active");
      const dateContainer = taskItem.querySelector(".date-container");
      const dates = Array.from(dateContainer.children).map(
        (child) => child.querySelector("span").textContent
      );
      tasks.push({
        text: taskInput.value,
        tag: activeTag ? activeTag.textContent : "Todo",
        dates: dates,
      });
    });
    chrome.storage.sync.set({ tasks: tasks });
    updateTaskCounts();
  }

  function loadTasks() {
    chrome.storage.sync.get("tasks", (data) => {
      if (data.tasks) {
        data.tasks.forEach((task) => {
          const taskItem = createTaskItem(task.text);
          const tags = taskItem.querySelectorAll(".tag");
          tags.forEach((tag) => {
            if (tag.textContent === task.tag) {
              setActiveTag(tag, taskItem);
            }
          });
          const dateContainer = taskItem.querySelector(".date-container");
          task.dates.forEach((date, index) => {
            dateContainer.children[index].querySelector("span").textContent =
              date;
          });
          taskList.appendChild(taskItem);
        });
        updateTaskCounts();
      }
    });
  }

  function updateTaskCounts() {
    const counts = {
      Todo: 0,
      Process: 0,
      Test: 0,
      Done: 0,
    };

    document.querySelectorAll(".task-item").forEach((taskItem) => {
      const activeTag = taskItem.querySelector(".tag.active");
      if (activeTag) {
        counts[activeTag.textContent]++;
      } else {
        counts.Todo++;
      }
    });

    Object.keys(counts).forEach((status) => {
      const countElement = document.getElementById(
        `${status.toLowerCase()}-count`
      );
      if (countElement) {
        countElement.textContent = counts[status];
      }
    });
  }

  function youtubeChannel() {
    window.open("https://www.youtube.com/@ahmadrezashamimi");
  }

  function exportToCsv() {
    const tasks = [];
    document.querySelectorAll(".task-item").forEach((taskItem) => {
      const taskInput = taskItem.querySelector("input");
      const activeTag = taskItem.querySelector(".tag.active");
      const dateContainer = taskItem.querySelector(".date-container");
      const dates = Array.from(dateContainer.children).map(
        (child) => child.querySelector("span").textContent
      );
      tasks.push({
        text: taskInput.value,
        tag: activeTag ? activeTag.textContent : "Todo",
        startDate: dates[0],
        processDate: dates[1],
        testDate: dates[2],
        endDate: dates[3],
      });
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Task,Status,Start Date,Process Date,Test Date,End Date\n" +
      tasks
        .map(
          (task) =>
            `"${task.text}","${task.tag}","${task.startDate}","${task.processDate}","${task.testDate}","${task.endDate}"`
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "todo_list.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
});
