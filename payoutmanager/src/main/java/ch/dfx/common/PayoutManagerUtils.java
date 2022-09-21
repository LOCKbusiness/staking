package ch.dfx.common;

import java.io.FileInputStream;
import java.math.BigDecimal;
import java.net.URI;
import java.sql.Connection;
import java.text.DecimalFormat;
import java.util.Properties;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.logging.log4j.core.LoggerContext;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import ch.dfx.common.enumeration.EnvironmentEnum;
import ch.dfx.common.enumeration.PropertyEnum;
import ch.dfx.common.errorhandling.DfxException;
import ch.dfx.common.provider.ConfigPropertyProvider;
import ch.dfx.defichain.provider.DefiDataProvider;
import ch.dfx.defichain.provider.DefiDataProviderImpl;

/**
 * 
 */
public class PayoutManagerUtils {
  private static final Logger LOGGER = LogManager.getLogger(PayoutManagerUtils.class);

  private static final boolean DEBUG_SECRET = false;

  public static final DecimalFormat NUMBER_FORMAT = new DecimalFormat("0.00000000");

  // ...
  private static final Gson GSON =
      new GsonBuilder()
          .setPrettyPrinting()
          .create();

  // ...
  private static final EnvironmentEnum ENVIRONMENT;

  static {
    String os = System.getProperty("os.name").toLowerCase();

    if (os.contains("win")) {
      ENVIRONMENT = EnvironmentEnum.WINDOWS;
    } else if (os.contains("mac")) {
      ENVIRONMENT = EnvironmentEnum.MACOS;
    } else {
      ENVIRONMENT = EnvironmentEnum.UNKNOWN;
    }
  }

  /**
   * 
   */
  public static EnvironmentEnum getEnvironment() {
    return ENVIRONMENT;
  }

  /**
   * 
   */
  public static boolean isWindows() {
    return EnvironmentEnum.WINDOWS == ENVIRONMENT;
  }

  /**
   * 
   */
  public static boolean isMacOs() {
    return EnvironmentEnum.MACOS == ENVIRONMENT;
  }

  /**
   * 
   */
  public static void initLog4j(@Nonnull String log4j2Xml) {
    LoggerContext context = (LoggerContext) LogManager.getContext(false);
    context.setConfigLocation(URI.create(log4j2Xml));
  }

  /**
   * 
   */
  public static void loadConfigProperties() throws DfxException {
    LOGGER.trace("loadConfigProperties() ...");

    String configFileName;

    if (isWindows()) {
      configFileName = "config.properties.windows";
    } else if (isMacOs()) {
      configFileName = "config.properties.macos";
    } else {
      throw new DfxException("loading 'config.properties': unknown environment");
    }

    Properties properties = new Properties();

    // Environment specific properties ...
    LOGGER.trace("configFileName: '" + configFileName + "'...");

    try (FileInputStream inputStream = new FileInputStream(configFileName)) {
      properties.load(inputStream);
    } catch (Exception e) {
      throw new DfxException("loading '" + configFileName + "' ...", e);
    }

    // Global Properties ...
    LOGGER.trace("configFileName: '" + "config.properties" + "'...");

    try (FileInputStream inputStream = new FileInputStream("config.properties")) {
      properties.load(inputStream);
    } catch (Exception e) {
      throw new DfxException("loading 'config.properties' ...", e);
    }

    // Secret Properties ...
    LOGGER.trace("configFileName: '" + "secret.properties" + "'...");

    try (FileInputStream inputStream = new FileInputStream("secret.properties")) {
      properties.load(inputStream);
    } catch (Exception e) {
      // Intentionally left blank ...
    }

    ConfigPropertyProvider.setup(properties);
  }

  /**
   * 
   */
  public static DefiDataProvider createDefiDataProvider() {
    LOGGER.trace("createDefiDataProvider() ...");

    String username = ConfigPropertyProvider.getInstance().getProperty(PropertyEnum.DFI_RPC_USERNAME);
    String password = ConfigPropertyProvider.getInstance().getProperty(PropertyEnum.DFI_RPC_PASSWORD);

    if (DEBUG_SECRET) {
      LOGGER.debug("DFI Username:" + username);
      LOGGER.debug("DFI Password:" + password);
    }

    UsernamePasswordCredentials credentials = new UsernamePasswordCredentials(username, password);

    CredentialsProvider credentialsProvider = new BasicCredentialsProvider();
    credentialsProvider.setCredentials(AuthScope.ANY, credentials);

    HttpClient httpClient = HttpClientBuilder.create().setDefaultCredentialsProvider(credentialsProvider).build();
    HttpPost httpPost = new HttpPost();

    // ...
    return new DefiDataProviderImpl(httpClient, httpPost);
  }

  /**
   * 
   */
  public static String toNumberFormatString(@Nullable BigDecimal value) {
    return null == value ? NUMBER_FORMAT.format(0) : NUMBER_FORMAT.format(value.doubleValue());
  }

  /**
   * 
   */
  public static String toJson(Object object) {
    String jsonString = "";

    if (null != object) {
      jsonString = GSON.toJson(object);
    }

    return jsonString;
  }

  /**
   * 
   */
  public static void rollback(@Nullable Connection connection) throws DfxException {
    try {
      if (null != connection) {
        connection.rollback();
      }
    } catch (Exception e) {
      throw new DfxException("rollback ...", e);
    }
  }
}
