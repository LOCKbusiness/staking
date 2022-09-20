package ch.dfx.lockbusiness.stakingbalances.ocean;

import java.math.BigDecimal;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import ch.dfx.common.PayoutManagerUtils;
import ch.dfx.common.errorhandling.DfxException;

/**
 * 
 * Example: https://defiscan.live/address/df1qh4fhv6kf25ggwl3y3qstw5gtu6k3xtflx3cxt9
 * 
 * 
 */
public class OceanHandlerMain {
  private static final Logger LOGGER = LogManager.getLogger(OceanHandlerMain.class);

  /**
   * 
   */
  public static void main(String[] args) throws DfxException {
    PayoutManagerUtils.initLog4j("log4j2-payoutmanager.xml");

    // ...
    OceanHandler oceanHandler = new OceanHandler();
    oceanHandler.setup("df1qh4fhv6kf25ggwl3y3qstw5gtu6k3xtflx3cxt9");

    String next = oceanHandler.webcall(null);

    while (null != next) {
      next = oceanHandler.webcall(next);
    }

    BigDecimal vinBalance = oceanHandler.getVinBalance();
    BigDecimal voutBalance = oceanHandler.getVoutBalance();
    BigDecimal balance = voutBalance.subtract(vinBalance);

    LOGGER.debug("vin Balance: " + vinBalance);
    LOGGER.debug("vout Balance: " + voutBalance);
    LOGGER.debug("Balance: " + balance);
  }
}
