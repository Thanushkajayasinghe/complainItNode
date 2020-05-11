const Pool = require("pg").Pool;
const pool = new Pool({
  host: "127.0.0.1",
  database: "complainIt",
  user: "postgres",
  password: "123456",
  port: 5432,
});

const signIn = (request, response) => {
  const { username, password } = request.body;

  if (username != "" && username != null) {
    pool.query(
      "SELECT * FROM normal_user_login where username = $1",
      [username],
      (error, results) => {
        if (results.rows == null || results.rows == [] || results.rows == "") {
          response.status(200).json("usernameNotFound");
        } else {
          var hash = results.rows[0].password;
          var bcrypt = require("bcrypt");
          hash = hash.replace(/^\$2y(.+)$/i, "$2a$1");
          bcrypt.compare(password, hash, function (err, res) {
            if (res == true) {
              response.status(200).json("passwordMatched");
            } else {
              response.status(200).json("passwordWrong");
            }
          });
        }
      }
    );
  }
};

const signUp = (request, response) => {
  const { Username, ConfirmPass, Email, Tel } = request.body;

  pool.query(
    "SELECT count(username) FROM normal_user_login where username = $1",
    [Username],
    (error, results) => {
      if (results.rows[0].count == 0) {
        var bcrypt = require("bcrypt");
        bcrypt.hash(ConfirmPass, 10, function (err, hash) {
          pool.query(
            "INSERT INTO normal_user_login (username, tel, email, password, cdate) VALUES ($1, $2, $3, $4, $5)",
            [Username, Tel, Email, hash, new Date()],
            (error, results, fields) => {
              if (error) throw error;
              response.status(200).json("successfullyUserCreated");
            }
          );
        });
      } else {
        response.status(200).json("UsernameAlreadyExists");
      }
    }
  );
};

const getMainCategories = (request, response) => {
  pool.query(
    "SELECT groupid, groupname FROM user_group \
    WHERE status= 'Active' and groupname <> 'SuperAdmin' and groupname <> 'Admin' \
    ORDER BY groupid ASC",
    (error, results) => {
      if (error) {
        throw error;
      }

      response.status(200).json(results.rows);
    }
  );
};

const getSubCategories = (request, response) => {
  const { id } = request.body;

  if (id != "" && id != null) {
    pool.query(
      "SELECT id, subgroupname FROM subgroup where groupid = $1",
      [id],
      (error, results) => {
        if (error) {
          throw error;
        }

        response.status(200).json(results.rows);
      }
    );
  }
};

const addComplain = (request, response) => {
  const {
    com_title,
    com_msg,
    com_category,    
    selectedItems,
    com_location_x,
    com_location_y,
    com_location_description,
    com_contact_person,
    com_contact_details,
    username,
    images,
  } = request.body;

  pool.query(
    "INSERT INTO complain (refno, complaintitle, complaindescription, category, x, y, locationdescription, contactperson, contactdetails, currentstatus, cby, cdate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)  RETURNING complainid",
    [
      Date.now(),
      com_title,
      com_msg,
      com_category,
      com_location_x,
      com_location_y,
      com_location_description,
      com_contact_person,
      com_contact_details,
      "New",
      username,
      new Date(),
    ],
    (error, results, fields) => {
      if (error) throw error;

      const complainId = results.rows[0].complainid;

      selectedItems.map(function (item) {
        pool.query(
          "INSERT INTO complain_to (complainid, ctypeid, ctoid, cby, cdate) VALUES ($1, $2, $3, $4, $5)",
          [
            complainId,
            item.MainCategory,
            item.SubCategory,
            username,
            new Date(),
          ],
          (error, results, fields) => {
            if (error) throw error;
          }
        );
      });

      images.map(function (item) {
        var base64Data = item.replace(/^data:image\/png;base64,/, "");

        const shortid = require("shortid");
        var filename = shortid.generate();      

        require("fs").writeFile('C:\\wamp64\\www\\AdminComplainIt\\public\\Images\\' + filename + '.png',
          base64Data,
          "base64",
          function (err, data) {
            if (err) {
              console.log("err", err);
            }
            console.log("success");
          }
        );

        pool.query(
          "INSERT INTO complain_fileupload (complainid, cby, cdate, fileapp) VALUES ($1, $2, $3, $4)",
          [complainId, username, new Date(), filename],
          (error, results, fields) => {
            if (error) throw error;
          }
        );
      });
    }
  );

  response.status(200).json("ComplainSuccessfullyAdded");
};

const loadComplains = (request, response) => {
  const { username } = request.body;

  if (username != "" && username != null) {
    pool.query(
      "SELECT * FROM complain where cby = $1",
      [username],
      (error, results) => {
        if (results != undefined) {
          response.status(200).json(results.rows);
        }
      }
    );
  } else {
    response.status(200).json("usernamenull");
  }
};

const searchComplain = (request, response) => {
  const { username, searchText } = request.body;

  if (username != "" && username != null) {
    pool.query(
      "SELECT * FROM complain where cby = $1 and (LOWER(complaintitle) LIKE LOWER($2) OR refno LIKE $2)",
      [username, "%" + searchText + "%"],
      (error, results) => {
        response.status(200).json(results.rows);
      }
    );
  }
};

const getComplainStatus = (request, response) => {
  const { refNo } = request.body;

  pool.query(
    "SELECT currentstatus, receivedstatus, processingstatus, completedstatus\
     ,receiveddatetime, processingdatetime, completeddatetime \
     FROM complain where refno = $1",
    [refNo],
    (error, results) => {
      response.status(200).json(results.rows);
    }
  );
};

const updateUser = (request, response) => {
  const id = parseInt(request.params.id);
  const { name, email } = request.body;

  pool.query(
    "UPDATE users SET name = $1, email = $2 WHERE id = $3",
    [name, email, id],
    (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).send(`User modified with ID: ${id}`);
    }
  );
};

const deleteUser = (request, response) => {
  const id = parseInt(request.params.id);

  pool.query("DELETE FROM users WHERE id = $1", [id], (error, results) => {
    if (error) {
      throw error;
    }
    response.status(200).send(`User deleted with ID: ${id}`);
  });
};

module.exports = {
  signIn,
  signUp,
  getMainCategories,
  getSubCategories,
  addComplain,
  loadComplains,
  searchComplain,
  getComplainStatus,

  updateUser,
  deleteUser,
};
