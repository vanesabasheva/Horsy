package at.ac.tuwien.sepm.assignment.individual.persistence.impl;

import at.ac.tuwien.sepm.assignment.individual.dto.HorseDetailDto;
import at.ac.tuwien.sepm.assignment.individual.entity.Horse;
import at.ac.tuwien.sepm.assignment.individual.exception.FatalException;
import at.ac.tuwien.sepm.assignment.individual.exception.NotFoundException;
import at.ac.tuwien.sepm.assignment.individual.exception.PersistenceLayerException;
import at.ac.tuwien.sepm.assignment.individual.persistence.HorseDao;
import at.ac.tuwien.sepm.assignment.individual.type.Sex;
import java.lang.invoke.MethodHandles;
import java.sql.*;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class HorseJdbcDao implements HorseDao {
  private static final Logger LOG = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static final String TABLE_NAME = "horse";
  private static final String SQL_DELETE = "DELETE FROM " + TABLE_NAME + " WHERE id = ?";
  private static final String SQL_SELECT_ALL = "SELECT * FROM " + TABLE_NAME;
  private static final String SQL_SELECT_BY_ID = "SELECT * FROM " + TABLE_NAME + " WHERE id = ?";
  private static final String SQL_UPDATE = "UPDATE " + TABLE_NAME
      + " SET name = ?"
      + "  , description = ?"
      + "  , date_of_birth = ?"
      + "  , sex = ?"
      + "  , owner_id = ?"
      + " WHERE id = ?";
  private static final String SQL_INSERT = "INSERT INTO " + TABLE_NAME +
          " (name, description, date_of_birth, sex, owner_id) VALUES ( ?, ?, ?, ?, ?)";

  private final JdbcTemplate jdbcTemplate;

  public HorseJdbcDao(
      JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  @Override
  public Horse createHorse(HorseDetailDto newHorse) throws PersistenceLayerException {
    LOG.trace("createHorse({}), Persistence", newHorse.name());
    try {
      KeyHolder keyHolder = new GeneratedKeyHolder();
      jdbcTemplate.update(connection -> {
        PreparedStatement stmt = connection.prepareStatement(SQL_INSERT, Statement.RETURN_GENERATED_KEYS);
        stmt.setString(1, newHorse.name());
        stmt.setString(2, newHorse.description());
        stmt.setDate(3, Date.valueOf(newHorse.dateOfBirth()));
        stmt.setString(4, newHorse.sex().toString());

        if(newHorse.ownerId() != null){
          stmt.setLong(5, newHorse.ownerId());
        } else {
          stmt.setNull(5, Types.NULL);
        }return stmt;
      }, keyHolder);
      return new Horse()
              .setName(newHorse.name())
              .setDescription(newHorse.description())
              .setDateOfBirth(newHorse.dateOfBirth())
              .setSex(newHorse.sex())
              .setOwnerId(newHorse.ownerId());
    }
    catch (DataAccessException e){
      throw new PersistenceLayerException("Persistence: Internal error occurred while creating a new horse", e);
    }
  }

  @Override
  public List<Horse> getAll() {
    LOG.trace("getAll()");
    return jdbcTemplate.query(SQL_SELECT_ALL, this::mapRow);
  }

  @Override
  public Horse getById(long id) throws NotFoundException {
    LOG.trace("getById({})", id);
    List<Horse> horses;
    horses = jdbcTemplate.query(SQL_SELECT_BY_ID, this::mapRow, id);

    if (horses.isEmpty()) {
      throw new NotFoundException("No horse with ID %d found".formatted(id));
    }
    if (horses.size() > 1) {
      // This should never happen!!
      throw new FatalException("Too many horses with ID %d found".formatted(id));
    }

    return horses.get(0);
  }


  @Override
  public Horse update(HorseDetailDto horse) throws NotFoundException {
    LOG.trace("update({})", horse);
    int updated = jdbcTemplate.update(SQL_UPDATE,
        horse.name(),
        horse.description(),
        horse.dateOfBirth(),
        horse.sex().toString(),
        horse.ownerId(),
        horse.id());
    if (updated == 0) {
      throw new NotFoundException("Could not update horse with ID " + horse.id() + ", because it does not exist");
    }

    return new Horse()
        .setId(horse.id())
        .setName(horse.name())
        .setDescription(horse.description())
        .setDateOfBirth(horse.dateOfBirth())
        .setSex(horse.sex())
        .setOwnerId(horse.ownerId())
        ;
  }


  private Horse mapRow(ResultSet result, int rownum) throws SQLException {
    return new Horse()
        .setId(result.getLong("id"))
        .setName(result.getString("name"))
        .setDescription(result.getString("description"))
        .setDateOfBirth(result.getDate("date_of_birth").toLocalDate())
        .setSex(Sex.valueOf(result.getString("sex")))
        .setOwnerId(result.getObject("owner_id", Long.class))
        ;
  }
}
