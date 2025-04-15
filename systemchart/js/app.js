// Common Functions

function hashCode(string){
    var hash = 0;
    for (var i = 0; i < string.length; i++) {
        var code = string.charCodeAt(i);
        hash = ((hash<<5)-hash)+code;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

function sort_obj (obj, sort_by) {
    return Object.entries(obj).sort(([, a], [, b]) => a[sort_by].localeCompare(b[sort_by]));
}

function update () {
    let members_parent = document.getElementsByClassName("members")[0];
    let elems_to_remove = document.getElementsByClassName("member");

    while(elems_to_remove[0]) {
        elems_to_remove[0].parentNode.removeChild(elems_to_remove[0]);
    }

    let sorted_elems = sort_obj(headmates_obj, "name");
    for (let i = 0; i < sorted_elems.length; i++) {
        sorted_elems[i][1]["element"].addEventListener("mousedown", startDrag);
        members_parent.appendChild(sorted_elems[i][1]["element"]);
    }

    updateAllConnections();
}

// Variables

let headmates_obj = {};
let popup_shown = false;

// Add Headmate

let headmate_popup = document.getElementById("headmate_add_popup");
let open_member_popup = document.getElementById("open_member_popup");
let headmate_name = document.getElementById("name");
let headmate_source = document.getElementById("source");
let headmate_image = document.getElementById("image");
let headmate_info = document.getElementById("info");
let add_headmate = document.getElementById("add_headmate");
let cancel_headmate = document.getElementById("cancel_headmate");

function show_member_popup () {
    if (popup_shown == false) {
        popup_shown = true;
        headmate_popup.style.display = "block";
    }
}

function hide_member_popup () {
    headmate_name.value = "";
    headmate_source.value = "";
    headmate_image.value = "";
    headmate_info.value = "";
    headmate_popup.style.display = "none";
    popup_shown = false;
}

function add_headmate_elem (headmate_obj) {
    let headmate_elem = document.createElement("div");
    headmate_elem.classList.add("member");
    headmate_elem.setAttribute("title", headmate_obj["info"]);
    headmate_elem.id = hashCode(headmate_obj["name"]).toString();

    let elem_title = document.createElement("h3");
    elem_title.innerText = headmate_obj["name"];

    let elem_source = document.createElement("p");
    elem_source.classList.add("subheading");
    elem_source.innerText = headmate_obj["source"];

    let elem_img = document.createElement("img");
    elem_img.setAttribute("draggable", "false");
    elem_img.src = headmate_obj["image"];

    headmate_elem.style.position = "relative";
    headmate_elem.style.left = "0px";
    headmate_elem.style.top = "0px";

    headmate_elem.appendChild(elem_title);
    headmate_elem.appendChild(elem_source);
    headmate_elem.appendChild(elem_img);

    return headmate_elem;
}

function add_new_headmate () {
    let temp_file = headmate_image.files[0];
    let reader = new FileReader();
    reader.readAsDataURL(temp_file);
    reader.onloadend = function() {
        let new_headmate_obj = {};
        new_headmate_obj["name"] = headmate_name.value;
        new_headmate_obj["source"] = headmate_source.value;
        new_headmate_obj["image"] = reader.result;
        new_headmate_obj["info"] = headmate_info.value;
        new_headmate_obj["connections"] = [];
        new_headmate_obj["element"] = add_headmate_elem(new_headmate_obj);
        headmates_obj[hashCode(headmate_name.value).toString()] = new_headmate_obj;

        hide_member_popup();
        update();
    }
}

function cancel_add_headmate () {
    hide_member_popup();
}

open_member_popup.addEventListener("click", show_member_popup);
add_headmate.addEventListener("click", add_new_headmate);
cancel_headmate.addEventListener("click", cancel_add_headmate);

// Add Connections

let temp_connection_changes = {};

let connections_popup = document.getElementById("connections_add_popup");
let open_connections_popup = document.getElementById("open_connections_popup");
let add_connections = document.getElementById("add_connections");
let cancel_connections = document.getElementById("cancel_connections");
let headmate_select = document.getElementById("initial_headmate");
let connections_container = document.getElementById("connections_container");

function show_connections_popup () {
    if (popup_shown == false) {
        for (let [key, value] of sort_obj(headmates_obj, "name")) {
            let new_option = document.createElement("option");
            new_option.value = key;
            new_option.text = value["name"];
            headmate_select.add(new_option);
        }

        for (let [key, value] of Object.entries(headmates_obj)) {
            temp_connection_changes[key] = value["connections"];
        }

        popup_shown = true;
        update_connection_options();
        connections_popup.style.display = "block";
    }
}

function hide_connections_popup () {
    headmate_select.options.length = 0;
    connections_popup.style.display = "none";
    popup_shown = false;
}

function update_temp_connection (e) {
    let connection_source = headmate_select.value;
    let connection_dest = e.currentTarget.value;
    if (e.currentTarget.checked) {
        temp_connection_changes[connection_source].push(connection_dest);
        temp_connection_changes[connection_dest].push(connection_source);
    } else {
        temp_connection_changes[connection_source].splice(temp_connection_changes[connection_source].indexOf(connection_dest), 1);
        temp_connection_changes[connection_dest].splice(temp_connection_changes[connection_dest].indexOf(connection_source), 1);
    }
}

function update_connection_options () {
    connections_container.innerHTML = "";
    for (let [key, value] of sort_obj(headmates_obj, "name")) {
        if (headmate_select.value != key) {
            let new_label = document.createElement("label");
            new_label.setAttribute("for", key);
            new_label.innerText = value["name"];

            let new_checkbox = document.createElement("input");
            new_checkbox.setAttribute("type", "checkbox");
            new_checkbox.value = key;
            if (temp_connection_changes[headmate_select.value].includes(key)) {
                new_checkbox.checked = true;
            }

            let new_container = document.createElement("div");
            new_container.appendChild(new_label);
            new_container.appendChild(new_checkbox);

            new_checkbox.addEventListener("input", update_temp_connection);

            connections_container.appendChild(new_container);
        }
    }
}

function add_new_connections () {
    for (let [key, value] of Object.entries(temp_connection_changes)) {
        headmates_obj[key]["connections"] = value;
    }
    hide_connections_popup();
    update();
}

function cancel_add_connections () {
    hide_connections_popup();
}

open_connections_popup.addEventListener("click", show_connections_popup);
add_connections.addEventListener("click", add_new_connections);
cancel_connections.addEventListener("click", cancel_add_connections);
headmate_select.addEventListener("change", update_connection_options);

// Draw Connections

let connections_canvas = document.getElementById("connections").getContext("2d");

connections_canvas.canvas.width = document.body.clientWidth;
connections_canvas.canvas.height = document.body.clientHeight;
window.addEventListener('resize', (event) => {
    requestAnimationFrame(() => {
        connections_canvas.canvas.width = document.body.clientWidth;
        connections_canvas.canvas.height = document.body.clientHeight;
    });
});

function getElemCenter(elem) {
    return [elem.offsetLeft + (elem.offsetWidth / 2), elem.offsetTop + (elem.offsetHeight / 2)];
}

function updateConnection(headmate_id) {
    elem_center = getElemCenter(document.getElementById(headmate_id));

    headmate_connections = headmates_obj[headmate_id]["connections"];

    for (let i = 0; i < headmate_connections.length; i++) {
        con_center = getElemCenter(document.getElementById(headmate_connections[i]));
        connections_canvas.beginPath();
        connections_canvas.moveTo(elem_center[0], elem_center[1]);
        connections_canvas.lineTo(con_center[0], con_center[1]);
        connections_canvas.lineWidth = 1;
        connections_canvas.stroke();
    }
}

function updateAllConnections() {
    connections_canvas.clearRect(0, 0, connections_canvas.canvas.width, connections_canvas.canvas.height);
    for (let i = 0; i < Object.keys(headmates_obj).length; i++) {
        updateConnection(Object.keys(headmates_obj)[i]);
    }
}

// Drag & Drop

let dragging_elem = null;
let init_coords = [];
let starting_pos = [];

function startDrag(mouse) {
    init_coords = [mouse.clientX, mouse.clientY];
    starting_pos = [parseInt(mouse.currentTarget.style.left.replace(/[^\d.-]/g, '')), parseInt(mouse.currentTarget.style.top.replace(/[^\d.-]/g, ''))];
    dragging_elem = mouse.currentTarget;
}

function stopDrag(mouse) {
    if (dragging_elem) {
        dragging_elem = null;
    }
}

function drag(mouse) {
    if (dragging_elem) {
        updateAllConnections();
        let mouse_coords = [mouse.clientX, mouse.clientY];

        dragging_elem.style.left = String(starting_pos[0] + (mouse_coords[0] - init_coords[0])) + "px";
        dragging_elem.style.top = String(starting_pos[1] + (mouse_coords[1] - init_coords[1])) + "px";
    }
}

document.addEventListener("mousemove", drag);
document.addEventListener("mouseup", stopDrag);

// Import / Export

let import_button = document.getElementById("import_button");
let export_button = document.getElementById("export_button");
let import_popup = document.getElementById("import_popup");
let import_file = document.getElementById("import_file");
let upload_file = document.getElementById("upload_file");
let cancel_file = document.getElementById("cancel_file");

function show_import_popup () {
    if (popup_shown == false) {
        popup_shown = true;
        import_popup.style.display = "block";
    }
}

function hide_import_popup () {
    import_popup.style.display = "none";
    popup_shown = false;
}

function replacer (key, value) {
    if (key == "element"){
        return undefined;
    } else {
        return value;
    }
}

function import_func () {
    let temp_file = import_file.files[0];
    let reader = new FileReader();
    reader.readAsText(temp_file);
    reader.onloadend = function() {
        headmates_obj = JSON.parse(reader.result);

        for (let [key, value] of Object.entries(headmates_obj)) {
            headmates_obj[key]["element"] = add_headmate_elem(value);
        }

        hide_import_popup();
        update();
    }
}

function cancel_import () {
    hide_import_popup();
}

function export_func () {
    var headmates_json = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(headmates_obj, replacer));
    var dl_anchor_elem = document.getElementById("download_anchor_elem");
    dl_anchor_elem.setAttribute("href", headmates_json);
    dl_anchor_elem.setAttribute("download", "system_chart.json");
    dl_anchor_elem.click();
}

export_button.addEventListener("click", export_func);
import_button.addEventListener("click", show_import_popup);
upload_file.addEventListener("click", import_func);
cancel_file.addEventListener("click", cancel_import);