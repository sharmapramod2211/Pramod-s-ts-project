import { functions } from "../library/functions";
import { appdb } from "./appdb";

const functionsObj = new functions();

interface Seat {
  flight_id: number;
  seat_number: string;
  booking_id?: number | null;
  status?: string;
}

interface ServiceResponse {
  error: boolean;
  message: string;
  data: any;
}

export class seatModel extends appdb {
  constructor() {
    super();
    this.table = "Seats";
    this.uniqueField = "seat_id";
  }


async getAvailableSeatsByFlight(flight_id: number): Promise<ServiceResponse> {
  try {
      this.table = "Seats";
      this.where = `WHERE flight_id = ${flight_id} AND status = 'AVAILABLE'`;

      const seats = await this.allRecords("seat_number");

      if (!seats || seats.length === 0) {
          return functionsObj.output(404, "No available seats found", []);
      }

      return functionsObj.output(200, "Available seats fetched successfully", seats);
  } catch (error) {
      console.error("Error fetching available seats:", error);
      return functionsObj.output(500, "Error fetching available seats", null);
  }
}


async getSeatByNumber(flight_id: number, seat_number: string): Promise<ServiceResponse> {
  try {
      this.table = "Seats";
      const query = `SELECT status FROM ${this.table} WHERE flight_id = $1 AND seat_number = $2`;
      const result = await this.executeQuery(query);

      if (!result.length) {
          return functionsObj.output(404, "Seat not found", null);
      }

      return functionsObj.output(200, "Seat details fetched successfully", result[0]);
  } catch (error) {
      console.error("Error fetching seat details:", error);
      return functionsObj.output(500, "Error fetching seat details", null);
  }
}


async bookSelectedSeats(flight_id: number, booking_id: number, seat_numbers: string[]): Promise<ServiceResponse> {
  try {
      this.table = "Seats";
      const query = `UPDATE ${this.table} SET status = 'BOOKED', booking_id = $1 WHERE flight_id = $2 AND seat_number = ANY($3)`;
      await this.executeQuery(query);

      return functionsObj.output(200, "Seats booked successfully", null);
  } catch (error) {
      console.error("Error booking seats:", error);
      return functionsObj.output(500, "Error booking seats", null);
  }
}


async updateSeatBooking(booking_id: number, flight_id: number, old_seats: string[], new_seats: string[]): Promise<ServiceResponse> {
  try {
     
      const releaseQuery = `UPDATE ${this.table} SET status = 'AVAILABLE', booking_id = NULL 
                            WHERE booking_id = $1 AND seat_number = ANY($2)`;
      await this.executeQuery(releaseQuery);

     
      const bookQuery = `UPDATE ${this.table} SET status = 'BOOKED', booking_id = $1 
                         WHERE flight_id = $2 AND seat_number = ANY($3)`;
      await this.executeQuery(bookQuery);

      return functionsObj.output(200, "Seats updated successfully", null);
  } catch (error) {
      console.error("Error updating seat booking:", error);
      return functionsObj.output(500, "Error updating seat booking", null);
  }
}


async cancelBookedSeats(booking_id: number, seat_numbers: string[]): Promise<ServiceResponse> {
  try {
      this.table = "Seats";
      const query = `UPDATE ${this.table} SET status = 'AVAILABLE', booking_id = NULL WHERE booking_id = $1 AND seat_number = ANY($2)`;
      await this.executeQuery(query);

      return functionsObj.output(200, "Seats cancelled successfully", null);
  } catch (error) {
      console.error("Error cancelling seats:", error);
      return functionsObj.output(500, "Error cancelling seats", null);
  }
}


async bookNewSeats(flight_id: number, booking_id: number, seat_numbers: string[]): Promise<ServiceResponse> {
  try {
      const query = `UPDATE ${this.table} SET status = 'BOOKED', booking_id = ${booking_id} 
                     WHERE flight_id = ${flight_id} AND seat_number IN ('${seat_numbers.join("','")}')`;
      await this.executeQuery(query);
      return functionsObj.output(200, "Seats booked successfully", null);
  } catch (error) {
      console.error("Error booking seats:", error);
      return functionsObj.output(500, "Error booking seats", null);
  }
}


async updateSeat(seat_id: number, seatData: Partial<Seat>): Promise<ServiceResponse> {
  try {
      this.table = "Seats";

      const updateFields = Object.keys(seatData).map((key, index) => `${key} = $${index + 1}`).join(", ");
      const values = Object.values(seatData);

      if (!updateFields) {
          return functionsObj.output(400, "No valid fields provided for update", null);
      }

      values.push(seat_id);

      const query = `UPDATE ${this.table} SET ${updateFields} WHERE seat_id = $${values.length}`;
      await this.executeQuery(query);

      return functionsObj.output(200, "Seat updated successfully", null);
  } catch (error) {
      console.error("Error updating seat:", error);
      return functionsObj.output(500, "Error updating seat", null);
  }
}


async deleteSeat(seat_id: number): Promise<ServiceResponse> {
  try {
      this.table = "Seats";

      const query = `DELETE FROM ${this.table} WHERE seat_id = $1`;
      await this.executeQuery(query);

      return functionsObj.output(200, "Seat deleted successfully", null);
  } catch (error) {
      console.error("Error deleting seat:", error);
      return functionsObj.output(500, "Error deleting seat", null);
  }
}


async releaseSeats(booking_id: number, seat_numbers: string[]): Promise<ServiceResponse> {
  try {
      const query = `UPDATE ${this.table} SET status = 'AVAILABLE', booking_id = NULL 
                     WHERE booking_id = ${booking_id} AND seat_number IN ('${seat_numbers.join("','")}')`;
      await this.executeQuery(query);
      return functionsObj.output(200, "Seats released successfully", null);
  } catch (error) {
      console.error("Error releasing seats:", error);
      return functionsObj.output(500, "Error releasing seats", null);
  }
}

}
