const RegisterMachine = require("../models/registerMachine.js");

class MachineDAO {
  async saveNewMachine(machineData) {
    const newMachine = new RegisterMachine(machineData);
    return newMachine.save();
  }
}

module.exports = new MachineDAO();
