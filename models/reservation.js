/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");


/** A reservation for a party */

class Reservation {
  constructor({id, customerId, numGuests, startAt, notes}) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  /** Use the getter/setter pattern with numGuests on a reservation, such that the setter 
   * throws an error if you try to make a reservation for fewer than 1 person. */
  set numGuests(val) {
    if (val < 1) throw new Error("Must have at least 1 guest. Please try again.");
    this._numGuests = val;
  }

  get numGuests() {
    return this._numGuests;
  }

  /* Use the getter/setter pattern with startAt on a reservation, so that you must set the 
  start date to a value that is a Date object. */
  set startAt(val) {
    if (val instanceof Date && !isNaN(val)) this._startAt = val;
    else throw new Error("Not a valid starting point. Please try again.");
  }

  get startAt() {
    return this._startAt;
  }

  /** formatter for startAt */

  getformattedStartAt() {
    return moment(this.startAt).format('MMMM Do YYYY, h:mm a');
  }

  /** For notes on a customer or reservation, use a hidden _notes property to ensure that if 
   * someone tries to assign a falsey value to a customer’s notes, the value instead gets assigned to an empty string.*/
  set notes(val) {
    this._notes = val || "";
  }

  get notes() {
    return this._notes;
  }

  /* Use the getter/setter pattern with customerId on a reservation, such that once a reservation
  is assigned a customerId, that key can never be assigned to a new value (attempts should throw an error). */

  set customerId(val) {
    if (this._customerId && this._customerId !== val)
      throw new Error("Unable to change Customer ID.");
    this._customerId = val;
  }

  get customerId() {
    return this._customerId;
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
          `SELECT id, 
           customer_id AS "customerId", 
           num_guests AS "numGuests", 
           start_at AS "startAt", 
           notes AS "notes"
         FROM reservations 
         WHERE customer_id = $1`,
        [customerId]
    );

    return results.rows.map(row => new Reservation(row));
  }

  /** Find a reservation by id. */
  static async get(id) {
    const result = await db.query(
      `SELECT id, 
           customer_id AS "customerId", 
           num_guests AS "numGuests", 
           start_at AS "startAt",
           notes
         FROM reservations 
         WHERE id = $1`,
      [id]
    );

    let reservation = results.row[0];

    if (reservation === undefined) {
      const err = new Error(`Could not find reservation: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Reservation(reservation);
  }

  /** We’ve already written a ***.save()*** method for customers. This either adds a 
   * new customer if they’re new, or updates the existing record if there are changes.
   * We don’t yet have a similar method for reservations, but we need one in order to 
   * save reservations. Write this. */
  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, num_guests, start_at, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.customerId, this.numGuests, this.startAt, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE reservations SET num_guests=$1, start_at=$2, notes=$3
             WHERE id=$4`,
        [this.numGuests, this.startAt, this.notes, this.id]
      );
    }
  }


}


module.exports = Reservation;
