export default {  
  ROOT: 3,
  ADMIN: 2,
  PROF: 1,
  ELEVE: 0,
  DISCONNECTED: -1,
  getLabel(rank) {
    switch(rank) {
      case this.ROOT:
        return "Root";
      case this.ADMIN:
        return "Admin";
      case this.PROF:
        return "Prof";
      case this.ELEVE:
        return "Élève";
      default :
        return "Off";
    }
  }
};