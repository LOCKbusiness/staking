package ch.dfx.lockbusiness.stakingbalances.ocean;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.util.EntityUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import ch.dfx.common.errorhandling.DfxException;
import ch.dfx.lockbusiness.stakingbalances.ocean.data.TransactionDetailVinData;
import ch.dfx.lockbusiness.stakingbalances.ocean.data.TransactionDetailVoutData;
import ch.dfx.lockbusiness.stakingbalances.ocean.data.TransactionsData;
import ch.dfx.lockbusiness.stakingbalances.ocean.data.TransactionsDetailData;
import ch.dfx.lockbusiness.stakingbalances.ocean.data.TransactionsPageData;

/**
 * 
 */
public class OceanHandler {
  private static final Logger LOGGER = LogManager.getLogger(OceanHandler.class);

  // ...
  private static final String OCEAN_URI = "https://ocean.defichain.com/v0/mainnet/address/";
  private static final int OCEAN_FETCH_SIZE = 200;

  // ...
  private final Gson gson;

  private final HttpClient httpClient;
  private final HttpGet httpGet;

  private String address = null;
  private BigDecimal vinBalance = null;
  private BigDecimal voutBalance = null;

  /**
   * 
   */
  public OceanHandler() {
    this.gson = new GsonBuilder().setPrettyPrinting().create();

    this.httpClient = HttpClientBuilder.create().build();
    this.httpGet = new HttpGet();
  }

  /**
   * 
   */
  public void setup(String address) {
    this.address = address;
    this.vinBalance = BigDecimal.ZERO;
    this.voutBalance = BigDecimal.ZERO;
  }

  public BigDecimal getVinBalance() {
    return vinBalance;
  }

  public BigDecimal getVoutBalance() {
    return voutBalance;
  }

  /**
   * 
   */
  public String webcall(String next) throws DfxException {
    try {
      StringBuilder oceanURIBuilder = new StringBuilder()
          .append(OCEAN_URI)
          .append(address)
          .append("/transactions?size=").append(OCEAN_FETCH_SIZE);

      if (null != next) {
        oceanURIBuilder.append("&next=").append(next);
      }

      String oceanURI = oceanURIBuilder.toString();
      LOGGER.debug("URI: " + oceanURI);

      httpGet.setURI(new URI(oceanURI));

      HttpResponse httpResponse = httpClient.execute(httpGet);
      HttpEntity httpEntity = httpResponse.getEntity();

      String jsonResponse = EntityUtils.toString(httpEntity);

      return analyzeTransactions(gson.fromJson(jsonResponse, TransactionsData.class));
    } catch (Exception e) {
      throw new DfxException("error", e);
    }
  }

  /**
   * 
   */
  private String analyzeTransactions(TransactionsData transactionsData) {
    List<TransactionsDetailData> transactionsDetailDataList = transactionsData.getData();

    for (TransactionsDetailData transactionsDetailData : transactionsDetailDataList) {
      if (0 == transactionsDetailData.getTokenId()) {
        TransactionDetailVinData transactionDetailVinData = transactionsDetailData.getVin();
        TransactionDetailVoutData transactionDetailVoutData = transactionsDetailData.getVout();

        if (null != transactionDetailVinData) {
          vinBalance = vinBalance.add(transactionsDetailData.getValue());
        } else if (null != transactionDetailVoutData) {
          voutBalance = voutBalance.add(transactionsDetailData.getValue());
        } else {
          LOGGER.error("no vin and vout found...");
        }
      } else {
        LOGGER.error("unknown token ...");
      }
    }

    String next = null;

    TransactionsPageData transactionPageData = transactionsData.getPage();

    if (null != transactionPageData) {
      next = transactionPageData.getNext();
    }

    return next;
  }
}
