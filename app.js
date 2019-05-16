var database = firebase.database();
var user_name = (domo.env.userName == undefined) ? "someone?" : domo.env.userName.replace("+", " ");
var user_id = domo.env.userId;
Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0, 10);
});


$(window).on('load', function() {
    loader(true);
    get_firebaseData();
});
domo.onDataUpdate(function() {});

function get_firebaseData() {
    var html = '';
    var rootRef = database.ref();
    rootRef.once("value")
        .then(function(snapshot) {
            var value = snapshot.val();
            if (value) {
                var length = Object.keys(value).length;
                for (i = 0; i < length; i++) {
                    var key1 = Object.keys(value)[i];
                    var v = value[`${key1}`];
                    html += `<tr id=${key1}>`;
                    html += `<td class="t1">${v.Name}</td>`;
                    html += `<td class="t2">${v.Submitter}</td>`;
                    html += `<td class="t3">${v.Reason}</td>`;
                    html += `<td class="t4"><input  id="cal_start${key1}" class="calendar_start" type="datetime-local" min="2018-01-01T00:00" placeholder="2018-06-12T19:30" value='${v.StartDate}'></td>`;
                    html += `<td class="t5"><input  id="cal_end${key1}" class="calendar_end" type="datetime-local" min="2018-01-01T00:00" placeholder="2018-06-12T19:30" value='${v.EndDate}'></td>`;
                    html += `<td class="t6">${v.Comments}</td>`;
                    html += `<td class="t7"><input type="button" class="action_b" onclick="action_pop('${key1}')" value="Action"></td>`;
                    html += `</tr>`;
                    html += `<tr><td class="t1"><div id="action_popup${key1}" style="display:none"><input class="action_b action_approve" type="button" onclick="submit_approval('${key1}','Approved')" value="Approve"></div></td>
                        <td><div  id="action_popup3${key1}" style="display:none; height:3em;"><input id = "comments${key1}" style="height: 100%; width: 114%;" type=text-box placeholder="Comments to tech..."></div></td>
                        <td class="t7"><div id="action_popup2${key1}" style="display:none"><input class="action_b action_deny" type="button" onclick="submit_approval('${key1}','Denied')" value="Deny"></div></td></tr>`
                }
                document.getElementById('requests').innerHTML = html;
                loader(false);
            } else {
                loader(false);
            }
        });
}
var key = '';

function action_pop(k) {
    key = '';
    key = k;
    $(`#action_popup${k}`).show();
    $(`#action_popup2${k}`).show();
    $(`#action_popup3${k}`).show();
}

function submit_approval(k, stat) {
    loader(true);
    key = k;
    var rootRef = database.ref();
    var val;
    rootRef.once("value")
        .then(function(snapshot) {
            console.log(key)
            console.log(snapshot)
            var value = snapshot.val();
            console.log(value)
            val = value[`${key}`];
            console.log(val)

            var obj = {
                "Name": val.Name,
                "StartDate": document.getElementById(`cal_start${key}`).value,
                "EndDate": document.getElementById(`cal_end${key}`).value,
                "Submitter": val.Submitter,
                "Reason": val.Reason,
                "Comments": val.Comments,
                "DateSubmitted": val.DateSubmitted,
                "Approval": stat,
                "Approved By": user_name,
                "Review Date": new Date().toDateInputValue(),
                "ManagerComments": document.getElementById(`comments${key}`).value,
            };
            var userId = val.UserId;
            buzz_user(obj, userId);
            $.ajax({
                url: `https://script.google.com/macros/s/-/exec`,
                data: obj,
                error: function(error) {
                    console.log(`error`);
                    console.log(error);
                },
                dataType: 'json',
                success: function(data) {
                    console.log('success');
                    resetTimer();
                    $(`#action_popup${key}`).hide();
                    $(`#action_popup2${key}`).hide();
                    $(`#action_popup3${key}`).hide();
                    $(`#${key}`).remove();
                    database.ref(`${key}`).remove();
                },
                type: "post"
            });
        });
}

function resetTimer() {
    var t;
    clearTimeout(t);
    t = setTimeout(clear_content, 100); // time is in milliseconds
}

function clear_content() {
    // setTimeout(pop_new(), 20000);


    console.log(`send request to kill firebase`)
    loader(false);
    get_firebaseData();
}

function loader(s) {
    if (s === true) {
        console.log('loader on');
        $('#loader').show();
    } else {
        console.log('loader off');
        $('#loader').hide();
    }

}

function buzz_user(obj, user) {
    var m = `Your request for shrink: "${obj.Reason}"\n\n From "${obj.StartDate}" to "${obj.EndDate}". \n\nHas been ${obj.Approval} by ${user_name}. \nComments: "${obj.ManagerComments}" \nPlease reach out to them if you have additional questions.`;
    var data = { domoUserId: user, msg: m };

    $.ajax({
        url: `https://script.google.com/macros/s//exec`,
        type: "POST",
        data: data,
        success: function(data) {
            console.log(data);
        },
        error: function(e) { console.log(e) }
    });
}